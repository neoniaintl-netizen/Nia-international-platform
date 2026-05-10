import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { BRAND_SLUG_TO_CATEGORY_SLUG } from "@/lib/crawler/brand-category-map";

/**
 * GET  /api/admin/recategorize-products?key=nkbus2026  — dry-run 미리보기
 * POST /api/admin/recategorize-products              — 실제 재할당
 *
 * BRAND_SLUG_TO_CATEGORY_SLUG 매핑 기반으로
 * 9개 브랜드 전 상품의 categoryId를 올바른 카테고리로 일괄 업데이트.
 * "기타"에 잘못 떨어진 50개 크롤링 상품 복구 목적.
 */

async function buildPlan() {
  const brands = await prisma.brand.findMany({
    where: { slug: { in: Object.keys(BRAND_SLUG_TO_CATEGORY_SLUG) } },
    select: { id: true, slug: true, name: true },
  });

  const categorySlugs = Array.from(
    new Set(Object.values(BRAND_SLUG_TO_CATEGORY_SLUG))
  );
  const categories = await prisma.category.findMany({
    where: { slug: { in: categorySlugs } },
    select: { id: true, slug: true, name: true },
  });
  const slugToCatId = new Map(categories.map((c) => [c.slug, c.id]));

  const plan: Array<{
    brandSlug: string;
    brandName: string;
    targetCategorySlug: string;
    targetCategoryId: string;
    productCount: number;
    alreadyCorrect: number;
    toMove: number;
  }> = [];

  for (const brand of brands) {
    const targetCatSlug = BRAND_SLUG_TO_CATEGORY_SLUG[brand.slug];
    const targetCatId = slugToCatId.get(targetCatSlug);
    if (!targetCatId) continue;

    const total = await prisma.product.count({
      where: { brandId: brand.id },
    });
    const alreadyCorrect = await prisma.product.count({
      where: { brandId: brand.id, categoryId: targetCatId },
    });

    plan.push({
      brandSlug: brand.slug,
      brandName: brand.name,
      targetCategorySlug: targetCatSlug,
      targetCategoryId: targetCatId,
      productCount: total,
      alreadyCorrect,
      toMove: total - alreadyCorrect,
    });
  }

  return plan;
}

export async function GET(req: NextRequest) {
  const key = req.headers.get("x-crawl-key") || req.nextUrl.searchParams.get("key");
  if (key !== "nkbus2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await buildPlan();
  const totalToMove = plan.reduce((s, p) => s + p.toMove, 0);

  return NextResponse.json({
    dryRun: true,
    totalToMove,
    plan: plan.map((p) => ({
      brand: p.brandSlug,
      targetCategory: p.targetCategorySlug,
      total: p.productCount,
      alreadyCorrect: p.alreadyCorrect,
      toMove: p.toMove,
    })),
  });
}

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-crawl-key");
  if (key !== "nkbus2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await buildPlan();
  const result: Array<{ brand: string; moved: number; targetCategory: string }> = [];

  for (const p of plan) {
    const updated = await prisma.product.updateMany({
      where: {
        brand: { slug: p.brandSlug },
        categoryId: { not: p.targetCategoryId },
      },
      data: { categoryId: p.targetCategoryId },
    });
    result.push({
      brand: p.brandSlug,
      targetCategory: p.targetCategorySlug,
      moved: updated.count,
    });
  }

  const totalMoved = result.reduce((s, r) => s + r.moved, 0);

  return NextResponse.json({ success: true, totalMoved, result });
}
