import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  GOLF_SUB_CATEGORIES,
  GOLF_BRANDS,
} from "@/lib/crawler/golf-category-map";
import { requireAdmin } from "@/lib/auth-guards";

/**
 * GET /api/admin/setup-golf-categories
 *
 * 골프 서브카테고리 9개 + 신규 골프 브랜드 10개 idempotent upsert
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  // 1) 부모 골프 카테고리 찾기
  const parentGolf = await prisma.category.findUnique({
    where: { slug: "golf" },
    select: { id: true },
  });
  if (!parentGolf) {
    return NextResponse.json(
      { error: "golf 카테고리가 없습니다 — setup-categories 먼저 실행" },
      { status: 400 }
    );
  }

  // 2) 서브 카테고리 upsert
  const categories: any[] = [];
  for (const c of GOLF_SUB_CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sortOrder: c.sortOrder },
      create: {
        slug: c.slug,
        name: c.name,
        depth: 1,
        sortOrder: c.sortOrder,
        parentId: parentGolf.id,
      },
    });
    categories.push({ slug: cat.slug, id: cat.id, name: cat.name });
  }

  // 3) 골프 브랜드 upsert
  const brands: any[] = [];
  for (const b of GOLF_BRANDS) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {
        nameKo: b.nameKo,
        description: b.description,
        isActive: true,
      },
      create: {
        slug: b.slug,
        name: b.name,
        nameKo: b.nameKo,
        description: b.description,
        isActive: true,
        followerCount: 1000,
      },
    });
    brands.push({ slug: brand.slug, id: brand.id, name: brand.name });
  }

  return NextResponse.json({
    success: true,
    subCategories: categories,
    brands,
  });
}
