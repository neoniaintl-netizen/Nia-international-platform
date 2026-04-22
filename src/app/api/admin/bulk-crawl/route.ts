import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCrawler } from "@/lib/crawler";
import { importCrawledProducts } from "@/lib/crawler/product-importer";

/**
 * POST /api/admin/bulk-crawl
 *   Headers: { x-crawl-key: nkbus2026 }
 *   Body (optional): { brands?: string[], maxItems?: number }
 *
 * 9개 브랜드 사이트를 일괄 크롤링 (병렬 fire-and-forget).
 * CrawlJob을 9개 생성하고 각각 runInBackground 실행.
 *
 * 기본 maxItems: 30 (브랜드당)
 * 기본 대상: 9개 전부
 */

const CRAWL_TARGETS = [
  // ── 아웃도어 (직접 크롤링 4개 + Musinsa 폴백 3개) ──
  {
    brandSlug: "salomon",
    sourceSite: "shopify",
    targetUrl: "https://salomon.co.kr/collections/sal-bestseller-all",
    note: "Shopify SSR — 베스트셀러",
  },
  {
    brandSlug: "patagonia",
    sourceSite: "musinsa",
    targetUrl: "https://www.musinsa.com/brand/patagonia",
    note: "Musinsa 폴백 (robots.txt 금지)",
  },
  {
    brandSlug: "arcteryx",
    sourceSite: "musinsa",
    targetUrl: "https://www.musinsa.com/brand/arcteryx",
    note: "Musinsa 폴백 (SPA)",
  },
  {
    brandSlug: "thenorthface",
    sourceSite: "generic",
    targetUrl:
      "https://www.thenorthfacekorea.co.kr/category/n/men/jacket-vest",
    note: "Generic SSR — 남성 재킷/베스트",
  },
  {
    brandSlug: "kolonsport",
    sourceSite: "musinsa",
    targetUrl: "https://www.musinsa.com/brand/kolonsport",
    note: "Musinsa 폴백 (Next.js SPA)",
  },

  // ── 스포츠 (직접 2 + Musinsa 폴백 2) ──
  {
    brandSlug: "descente",
    sourceSite: "musinsa",
    targetUrl: "https://www.musinsa.com/brand/descente",
    note: "Musinsa 폴백 (robots.txt 금지)",
  },
  {
    brandSlug: "wilson",
    sourceSite: "shopify",
    targetUrl: "https://kr.wilson.com/collections/women-shoes-all",
    note: "Shopify SSR — 여성 슈즈",
  },
  {
    brandSlug: "aloyoga",
    sourceSite: "shopify",
    targetUrl: "https://www.aloyoga.com/ko-kr/collections/bestsellers",
    note: "Shopify SSR — 유일 옵션",
  },
  {
    brandSlug: "nike-skims",
    sourceSite: "musinsa",
    targetUrl: "https://www.musinsa.com/brand/nike",
    note: "Musinsa 폴백 (Akamai 차단)",
  },
];

// ─── 백그라운드 크롤 실행 (fire-and-forget) ───
async function runCrawlInBackground(
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

    const importResult = await importCrawledProducts(result.products, jobId);

    const allErrors = [...result.errors, ...importResult.errors];
    await prisma.crawlJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        totalItems: result.totalItems,
        successItems: importResult.imported,
        failedItems: result.failedItems + importResult.errors.length,
        errorLog: allErrors.length > 0 ? allErrors.join("\n").slice(0, 5000) : null,
        completedAt: new Date(),
      },
    });
  } catch (crawlError: any) {
    await prisma.crawlJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorLog: (crawlError.message || "Unknown error").slice(0, 5000),
        completedAt: new Date(),
      },
    });
  }
}

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-crawl-key");
  if (key !== "nkbus2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {}
  const requestedBrands: string[] | undefined = body?.brands;
  const maxItems: number = Number(body?.maxItems) || 30;

  const targets = requestedBrands?.length
    ? CRAWL_TARGETS.filter((t) => requestedBrands.includes(t.brandSlug))
    : CRAWL_TARGETS;

  if (targets.length === 0) {
    return NextResponse.json(
      { error: "유효한 브랜드를 찾을 수 없습니다." },
      { status: 400 }
    );
  }

  // 각 타겟별로 CrawlJob 생성 후 백그라운드 실행
  const jobs = [];
  for (const target of targets) {
    const job = await prisma.crawlJob.create({
      data: {
        sourceSite: target.sourceSite,
        targetUrl: target.targetUrl,
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    // fire-and-forget — await 안 함
    void runCrawlInBackground(
      job.id,
      target.sourceSite,
      target.targetUrl,
      maxItems
    );

    jobs.push({
      brandSlug: target.brandSlug,
      sourceSite: target.sourceSite,
      jobId: job.id,
      targetUrl: target.targetUrl,
      note: target.note,
    });
  }

  return NextResponse.json({
    success: true,
    message: `${jobs.length}개 브랜드 크롤링 시작 — 각 ${maxItems}개 상품`,
    jobs,
  });
}

export async function GET(req: NextRequest) {
  const key = req.headers.get("x-crawl-key") || req.nextUrl.searchParams.get("key");
  if (key !== "nkbus2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 9개 브랜드 최근 Job 상태 조회
  const recent = await prisma.crawlJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      sourceSite: true,
      targetUrl: true,
      status: true,
      totalItems: true,
      successItems: true,
      failedItems: true,
      createdAt: true,
      completedAt: true,
    },
  });

  return NextResponse.json({
    targets: CRAWL_TARGETS,
    recentJobs: recent,
  });
}
