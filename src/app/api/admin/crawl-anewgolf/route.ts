import { NextRequest, NextResponse } from "next/server";
import { requireOpsToken } from "@/lib/ops-auth";
import { prisma } from "@/lib/db";
import { AnewGolfCrawler } from "@/lib/crawler/anewgolf-crawler";
import { importCrawledProducts } from "@/lib/crawler/product-importer";

/**
 * POST /api/admin/crawl-anewgolf
 *   Headers: { x-ops-token: <ADMIN_OPS_TOKEN> }
 *   Body (optional): { limit?: number (max 5), targetUrl?: string }
 *
 * 어뉴골프 (anewgolf.com) 에서 최대 5개 상품을 수집해 status=DRAFT 로 import.
 *
 * 안전 가드:
 *   - ops-token 필수 (default-deny)
 *   - 5개 한도 hardcoded
 *   - 요청 간 2초 딜레이
 *   - status=DRAFT 강제 (자동 공개 X)
 *   - /product/* 만 접근 (robots.txt 허용 영역)
 *
 * 운영자 워크플로우:
 *   1) 이 라우트 호출 → DRAFT 5개 import
 *   2) /admin/products?status=DRAFT 에서 검수
 *   3) ACTIVE 로 승격 → 일반 사이트에 노출
 *
 * GET 메소드는 import 결과 미리보기 / 운영 도구.
 */

const HARD_LIMIT = 5;
const DELAY_MS = 2000;
const DEFAULT_TARGET = "https://anewgolf.com/"; // 메인 페이지 (실제 상품 카드 노출)

export async function POST(req: NextRequest) {
  const block = requireOpsToken(req);
  if (block) return block;

  let body: { limit?: number; targetUrl?: string } = {};
  try {
    body = await req.json();
  } catch {
    // body 없어도 OK — 기본값 사용
  }

  const limit = Math.min(body.limit ?? HARD_LIMIT, HARD_LIMIT);
  const targetUrl = body.targetUrl ?? DEFAULT_TARGET;

  // anewgolf 도메인 외 URL 거부 (SSRF 인접 위험 차단)
  if (!targetUrl.startsWith("https://anewgolf.com/")) {
    return NextResponse.json(
      { error: "targetUrl must be on https://anewgolf.com/" },
      { status: 400 },
    );
  }

  // CrawlJob 생성 (이력 추적용)
  const job = await prisma.crawlJob.create({
    data: {
      sourceSite: "anewgolf",
      targetUrl,
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  try {
    const crawler = new AnewGolfCrawler();
    const result = await crawler.crawl({
      sourceSite: "anewgolf",
      targetUrl,
      maxItems: limit,
      delayMs: DELAY_MS,
    });

    // import → status=DRAFT (검수 대기)
    const importResult = await importCrawledProducts(
      result.products,
      job.id,
      { initialStatus: "DRAFT" },
    );

    await prisma.crawlJob.update({
      where: { id: job.id },
      data: {
        status: result.success ? "COMPLETED" : "FAILED",
        totalItems: result.totalItems,
        successItems: importResult.imported,
        failedItems: importResult.errors.length + result.errors.length,
        errorLog: [...result.errors, ...importResult.errors].join("\n") || null,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      crawled: {
        totalUrls: result.totalItems,
        parsed: result.products.length,
        crawlErrors: result.errors,
      },
      imported: {
        count: importResult.imported,
        skipped: importResult.skipped,
        errors: importResult.errors,
      },
      sample: result.products.slice(0, limit).map((p) => ({
        name: p.name,
        brandName: p.brandName,
        originalPrice: p.originalPrice,
        salePrice: p.salePrice,
        gender: p.gender,
        material: p.material,
        origin: p.origin,
        careGuide: p.careGuide,
        externalProductId: p.externalProductId,
        imageCount: p.imageUrls.length,
        variantCount: p.variants?.length ?? 0,
        sourceUrl: p.sourceUrl,
      })),
      next: `/admin/products?status=DRAFT — 5개 상품 검수 후 ACTIVE 로 승격`,
    });
  } catch (err: any) {
    await prisma.crawlJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errorLog: err.message,
        completedAt: new Date(),
      },
    });
    return NextResponse.json(
      { error: err.message, jobId: job.id },
      { status: 500 },
    );
  }
}

/**
 * GET — 최근 수집 잡 상태 + DRAFT 상품 미리보기 (운영 도구)
 */
export async function GET(req: NextRequest) {
  const block = requireOpsToken(req);
  if (block) return block;

  const recentJobs = await prisma.crawlJob.findMany({
    where: { sourceSite: "anewgolf" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      targetUrl: true,
      status: true,
      totalItems: true,
      successItems: true,
      failedItems: true,
      createdAt: true,
      completedAt: true,
    },
  });

  const draftProducts = await prisma.product.findMany({
    where: { sourceSite: "anewgolf", status: "DRAFT" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      name: true,
      slug: true,
      originalPrice: true,
      salePrice: true,
      sourceUrl: true,
      createdAt: true,
      brand: { select: { name: true } },
      _count: { select: { images: true, variants: true } },
    },
  });

  return NextResponse.json({
    recentJobs,
    draftProducts,
    info: "POST 로 신규 수집, /admin/products?status=DRAFT 에서 검수",
  });
}
