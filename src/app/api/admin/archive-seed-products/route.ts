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

  // 랭킹에서 실제 크롤링 상품들에 rankPosition 부여 (리뷰 평점 기준 상위 6개)
  const topActive = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      sourceUrl: { not: null },
    },
    orderBy: [{ reviewAvg: "desc" }, { createdAt: "desc" }],
    take: 6,
    select: { id: true, name: true },
  });

  for (let i = 0; i < topActive.length; i++) {
    await prisma.product.update({
      where: { id: topActive[i].id },
      data: { rankPosition: i + 1, isBest: true },
    });
  }

  return NextResponse.json({
    success: true,
    archived: updated.count,
    rankedNew: topActive.map((p, i) => ({ rank: i + 1, name: p.name })),
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
