import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { getCrawler } from "@/lib/crawler";
import { importCrawledProducts } from "@/lib/crawler/product-importer";

/**
 * POST /api/admin/bulk-crawl
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
  // 글로벌 사이트(www.aloyoga.com/collections)는 한국 IP에서 403 차단되므로
  // /ko-kr/ 한국어 페이지로 사용
  {
    brandSlug: "aloyoga",
    sourceSite: "shopify",
    targetUrl: "https://www.aloyoga.com/ko-kr/collections/bestsellers",
    note: "Shopify SSR — 한국 베스트셀러",
  },
  {
    brandSlug: "aloyoga",
    sourceSite: "shopify",
    targetUrl: "https://www.aloyoga.com/ko-kr/collections/leggings",
    note: "Shopify SSR — 레깅스",
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

  // ── Musinsa 폴백 (현재 불가능, 참고용만) ──
  // Patagonia/Arc'teryx/Kolon/Descente/Nike은 수동 시드 스크립트로 처리
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
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

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
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

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
