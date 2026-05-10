import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/admin/archive-seed-products
 *   Headers: { x-crawl-key: nkbus2026 }
 *
 * seed.ts로 들어간 데모 상품(sourceUrl 없는 상품)을 ARCHIVED로 전환.
 * 한글 깨지는 placehold 이미지 숨기고, 실제 크롤링 상품만 노출.
 */
export async function POST(req: NextRequest) {
  const key = req.headers.get("x-crawl-key");
  if (key !== "nkbus2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // sourceUrl이 없는 상품 = seed 데모
  const seedProducts = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      sourceUrl: null,
    },
    select: { id: true, name: true, brand: { select: { slug: true } } },
  });

  const updated = await prisma.product.updateMany({
    where: {
      id: { in: seedProducts.map((p) => p.id) },
    },
    data: {
      status: "ARCHIVED",
      rankPosition: null, // 랭킹에서도 제거
    },
  });

  // 기존 rankPosition 전부 초기화 (수동 시드 상품 포함)
  await prisma.product.updateMany({
    where: { rankPosition: { not: null } },
    data: { rankPosition: null },
  });

  // 실제 크롤링 브랜드만 랭킹 후보 (seed-fallback/seed 제외)
  // 한 브랜드가 랭킹 전체 점유 방지 — 브랜드별 2개씩 분산
  const realBrandSlugs = ["salomon", "wilson", "thenorthface"];
  const rankingCandidates: { id: string; name: string; brandSlug: string }[] = [];

  for (const slug of realBrandSlugs) {
    const brandTop = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        brand: { slug },
        sourceSite: { notIn: ["seed-fallback"] },
      },
      orderBy: [{ reviewAvg: "desc" }, { createdAt: "desc" }],
      take: 2, // 브랜드당 2개
      select: { id: true, name: true },
    });
    for (const p of brandTop) {
      rankingCandidates.push({ ...p, brandSlug: slug });
    }
  }

  // rankPosition 1~6 부여
  const finalRanking = rankingCandidates.slice(0, 6);
  for (let i = 0; i < finalRanking.length; i++) {
    await prisma.product.update({
      where: { id: finalRanking[i].id },
      data: { rankPosition: i + 1, isBest: true },
    });
  }

  return NextResponse.json({
    success: true,
    archived: updated.count,
    rankedNew: finalRanking.map((p, i) => ({
      rank: i + 1,
      brand: p.brandSlug,
      name: p.name,
    })),
    archivedProducts: seedProducts.map((p) => ({
      brand: p.brand.slug,
      name: p.name.slice(0, 40),
    })),
  });
}

export async function GET(req: NextRequest) {
  const key = req.headers.get("x-crawl-key") || req.nextUrl.searchParams.get("key");
  if (key !== "nkbus2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await prisma.product.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  const sourceNull = await prisma.product.count({
    where: { sourceUrl: null, status: "ACTIVE" },
  });
  const sourceNotNull = await prisma.product.count({
    where: { sourceUrl: { not: null }, status: "ACTIVE" },
  });

  return NextResponse.json({
    byStatus: stats,
    activeWithoutSource: sourceNull,
    activeWithSource: sourceNotNull,
  });
}
