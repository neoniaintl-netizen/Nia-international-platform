import { NextRequest, NextResponse } from "next/server";
import { requireOpsToken } from "@/lib/ops-auth";
import { prisma } from "@/lib/db";
import { getCrawler } from "@/lib/crawler";
import { importCrawledProducts } from "@/lib/crawler/product-importer";

/**
 * POST /api/admin/bulk-crawl
 *   Headers: { x-ops-token: <ADMIN_OPS_TOKEN> }
 *   Body (optional): { brands?: string[], maxItems?: number }
 *
 * 9개 브랜드 사이트를 일괄 크롤링 (병렬 fire-and-forget).
 * CrawlJob을 9개 생성하고 각각 runInBackground 실행.
 *
 * 기본 maxItems: 30 (브랜드당)
 * 기본 대상: 9개 전부
 */

const CRAWL_TARGETS = [
  // ── Salomon (Shopify 다중) ──
  {
    brandSlug: "salomon",
    sourceSite: "shopify",
    targetUrl: "https://salomon.co.kr/collections/sal-bestseller-all",
    note: "Shopify SSR — 베스트셀러",
  },
  {
    brandSlug: "salomon",
    sourceSite: "shopify",
    targetUrl: "https://salomon.co.kr/collections/sal-all-shoes",
    note: "Shopify SSR — 전체 슈즈",
  },

  // ── Wilson (Shopify 다중 성별) ──
  {
    brandSlug: "wilson",
    sourceSite: "shopify",
    targetUrl: "https://kr.wilson.com/collections/women-shoes-all",
    note: "Shopify SSR — 여성 슈즈",
  },
  {
    brandSlug: "wilson",
    sourceSite: "shopify",
    targetUrl: "https://kr.wilson.com/collections/men-shoes-all",
    note: "Shopify SSR — 남성 슈즈",
  },

  // ── Alo Yoga (Shopify 다중 URL 폴백) ──
  {
    brandSlug: "aloyoga",
    sourceSite: "shopify",
    targetUrl: "https://www.aloyoga.com/collections/bestsellers",
    note: "Shopify SSR — 글로벌 베스트셀러",
  },
  {
    brandSlug: "aloyoga",
    sourceSite: "shopify",
    targetUrl: "https://www.aloyoga.com/collections/womens-leggings",
    note: "Shopify SSR — 여성 레깅스",
  },

  // ── The North Face (Generic 3개 카테고리) ──
  {
    brandSlug: "thenorthface",
    sourceSite: "northface",
    targetUrl:
      "https://www.thenorthfacekorea.co.kr/category/n/men/jacket-vest",
    note: "Generic SSR — 남성 재킷/베스트",
  },
  {
    brandSlug: "thenorthface",
    sourceSite: "northface",
    targetUrl: "https://www.thenorthfacekorea.co.kr/category/n/men/tops",
    note: "Generic SSR — 남성 상의",
  },
  {
    brandSlug: "thenorthface",
    sourceSite: "northface",
    targetUrl:
      "https://www.thenorthfacekorea.co.kr/category/n/women/jacket-vest",
    note: "Generic SSR — 여성 재킷/베스트",
  },

  // ── Patagonia 한국 (Shopify 추정) ──
  {
    brandSlug: "patagonia",
    sourceSite: "shopify",
    targetUrl: "https://www.patagonia.co.kr/collections/all",
    note: "Shopify — 전체",
  },
  {
    brandSlug: "patagonia",
    sourceSite: "shopify",
    targetUrl: "https://www.patagonia.co.kr/collections/mens",
    note: "Shopify — 남성",
  },

  // ── Arc'teryx 한국 (Next.js SPA, JSON-LD 기반) ──
  {
    brandSlug: "arcteryx",
    sourceSite: "arcteryx",
    targetUrl: "https://arcteryx.co.kr/products/category/97",
    note: "Arc'teryx — 카테고리 97",
  },
  {
    brandSlug: "arcteryx",
    sourceSite: "arcteryx",
    targetUrl: "https://arcteryx.co.kr/products/category/134",
    note: "Arc'teryx — 카테고리 134",
  },

  // ── Kolon Sport (자체 시스템 / generic) ──
  {
    brandSlug: "kolonsport",
    sourceSite: "generic",
    targetUrl: "https://www.kolonsport.com/Page/man",
    note: "Generic — 남성",
  },
  {
    brandSlug: "kolonsport",
    sourceSite: "generic",
    targetUrl: "https://www.kolonsport.com/Page/woman",
    note: "Generic — 여성",
  },

  // ── Descente (dk-on / dkon-crawler) ──
  {
    brandSlug: "descente",
    sourceSite: "dkon",
    targetUrl: "https://dk-on.com/DESCENTE/category/MAN",
    note: "dkon — 남성",
  },
  {
    brandSlug: "descente",
    sourceSite: "dkon",
    targetUrl: "https://dk-on.com/DESCENTE/category/WOMAN",
    note: "dkon — 여성",
  },

  // ── Nike SKIMS (Nike SPA / generic) ──
  {
    brandSlug: "nike-skims",
    sourceSite: "generic",
    targetUrl: "https://www.nike.com/kr/w/womens-nikeskims",
    note: "Generic — Nike SKIMS 여성",
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
  const block = requireOpsToken(req);
  if (block) return block;

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
  const block = requireOpsToken(req);
  if (block) return block;

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
