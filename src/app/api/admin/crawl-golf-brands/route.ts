import { NextRequest, NextResponse } from "next/server";
import { requireOpsToken } from "@/lib/ops-auth";
import { prisma } from "@/lib/db";
import { getCrawler } from "@/lib/crawler";
import { importCrawledProducts } from "@/lib/crawler/product-importer";
import { GOLF_BRANDS } from "@/lib/crawler/golf-category-map";

/**
 * POST /api/admin/crawl-golf-brands
 *   Headers: { x-ops-token: <ADMIN_OPS_TOKEN> }
 *   Body (optional): { brands?: string[], maxPerCategory?: number }
 *
 * 10개 골프 브랜드 × 각 카테고리별 병렬 크롤링 (fire-and-forget).
 * 각 카테고리당 최대 maxPerCategory (기본 15개) 상품.
 */

async function runJob(
  jobId: string,
  sourceSite: string,
  targetUrl: string,
  maxItems: number
) {
  try {
    const crawler = getCrawler(sourceSite);
    const result = await crawler.crawl({
      sourceSite,
      targetUrl,
      maxItems,
      delayMs: 800,
    });
    const imported = await importCrawledProducts(result.products, jobId);

    await prisma.crawlJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        totalItems: result.totalItems,
        successItems: imported.imported,
        failedItems: result.failedItems + imported.errors.length,
        errorLog: [...result.errors, ...imported.errors].join("\n").slice(0, 5000) || null,
        completedAt: new Date(),
      },
    });
  } catch (err: any) {
    await prisma.crawlJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorLog: (err.message || "Unknown error").slice(0, 5000),
        completedAt: new Date(),
      },
    });
  }
}

export async function POST(req: NextRequest) {
  const block = requireOpsToken(req);
  if (block) return block;

  let body: any = {};
  try { body = await req.json(); } catch {}
  const selectedBrands: string[] | undefined = body?.brands;
  const maxPerCategory: number = Number(body?.maxPerCategory) || 15;

  const targets = selectedBrands?.length
    ? GOLF_BRANDS.filter((b) => selectedBrands.includes(b.slug))
    : GOLF_BRANDS;

  if (targets.length === 0) {
    return NextResponse.json({ error: "No valid brands" }, { status: 400 });
  }

  const jobs: any[] = [];
  for (const brand of targets) {
    for (const cat of brand.categories) {
      const job = await prisma.crawlJob.create({
        data: {
          sourceSite: brand.sourceSite,
          targetUrl: cat.sourceUrl,
          status: "RUNNING",
          startedAt: new Date(),
        },
      });
      // fire-and-forget
      void runJob(job.id, brand.sourceSite, cat.sourceUrl, maxPerCategory);
      jobs.push({
        brand: brand.slug,
        subCategory: cat.subCategorySlug,
        sourceSite: brand.sourceSite,
        jobId: job.id,
        url: cat.sourceUrl,
      });
    }
  }

  return NextResponse.json({
    success: true,
    totalJobs: jobs.length,
    maxPerCategory,
    jobs,
  });
}
