import { NextRequest, NextResponse } from "next/server";
import { requireOpsToken } from "@/lib/ops-auth";
import { prisma } from "@/lib/db";
import { resolveGolfSubCategoryFromSourceUrl } from "@/lib/crawler/golf-category-map";

/**
 * POST /api/admin/recategorize-golf
 *   Headers: { x-ops-token: <ADMIN_OPS_TOKEN> }
 *
 * 크롤링된 골프 상품의 sourceUrl → 서브 카테고리 매핑 반영
 * (crawl-golf-brands 이후 실행)
 */
export async function POST(req: NextRequest) {
  const block = requireOpsToken(req);
  if (block) return block;

  // 서브 카테고리 slug → id 맵
  const subCats = await prisma.category.findMany({
    where: { slug: { startsWith: "golf-" } },
    select: { id: true, slug: true },
  });
  const slugToId = new Map(subCats.map((c) => [c.slug, c.id]));

  // 골프 브랜드 상품들 (Job의 targetUrl로 매핑하기 위해 crawlJobId 기반 조회)
  // Product에 crawlJobId가 있으므로 조인
  const golfBrandSlugs = [
    "mark-lona", "southcape", "anewgolf", "iceberg-golf", "utaa",
    "pelt", "gfore", "thecart", "descente-golf", "pxg",
  ];
  const brands = await prisma.brand.findMany({
    where: { slug: { in: golfBrandSlugs } },
    select: { id: true, slug: true },
  });
  const brandIds = brands.map((b) => b.id);

  const products = await prisma.product.findMany({
    where: { brandId: { in: brandIds } },
    select: {
      id: true,
      name: true,
      categoryId: true,
      crawlJobId: true,
      brand: { select: { slug: true } },
    },
  });

  // crawlJobId별 targetUrl 조회 (한 번에)
  const jobIds = Array.from(
    new Set(products.map((p) => p.crawlJobId).filter(Boolean))
  ) as string[];
  const jobs = await prisma.crawlJob.findMany({
    where: { id: { in: jobIds } },
    select: { id: true, targetUrl: true },
  });
  const jobToUrl = new Map(jobs.map((j) => [j.id, j.targetUrl]));

  let reassigned = 0;
  let unchanged = 0;
  let unresolved = 0;
  const sampleReassigns: any[] = [];

  for (const p of products) {
    if (!p.crawlJobId) {
      unresolved++;
      continue;
    }
    const targetUrl = jobToUrl.get(p.crawlJobId);
    if (!targetUrl) {
      unresolved++;
      continue;
    }
    const subSlug = resolveGolfSubCategoryFromSourceUrl(targetUrl);
    if (!subSlug) {
      unresolved++;
      continue;
    }
    const newCatId = slugToId.get(subSlug);
    if (!newCatId) {
      unresolved++;
      continue;
    }
    if (p.categoryId === newCatId) {
      unchanged++;
      continue;
    }
    await prisma.product.update({
      where: { id: p.id },
      data: { categoryId: newCatId },
    });
    reassigned++;
    if (sampleReassigns.length < 10) {
      sampleReassigns.push({
        name: p.name.slice(0, 40),
        brand: p.brand.slug,
        newCategory: subSlug,
      });
    }
  }

  return NextResponse.json({
    success: true,
    total: products.length,
    reassigned,
    unchanged,
    unresolved,
    sampleReassigns,
  });
}
