import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/admin/consolidate-brands
 *   Headers: { x-crawl-key: nkbus2026 }
 *
 * 상품의 sourceUrl 호스트를 기준으로 올바른 Brand에 재연결.
 * 크롤링 시 brand.name 불일치로 잘못된 Brand 레코드에 연결된 상품을 복구.
 */

const HOST_TO_BRAND_SLUG: Array<{ match: RegExp; slug: string }> = [
  { match: /salomon\.co\.kr/i, slug: "salomon" },
  { match: /wilson\.com/i, slug: "wilson" },
  { match: /aloyoga\.com/i, slug: "aloyoga" },
  { match: /thenorthfacekorea\.co\.kr/i, slug: "thenorthface" },
  { match: /patagonia\.co\.kr/i, slug: "patagonia" },
  { match: /arcteryx\.co\.kr/i, slug: "arcteryx" },
  { match: /kolonsport\.com/i, slug: "kolonsport" },
  { match: /dk-on\.com/i, slug: "descente" },
  { match: /nike\.com/i, slug: "nike-skims" },
];

function inferBrandSlugFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.toLowerCase();
    for (const { match, slug } of HOST_TO_BRAND_SLUG) {
      if (match.test(host)) return slug;
    }
  } catch {}
  return null;
}

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-crawl-key");
  if (key !== "nkbus2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 모든 브랜드 로드 (slug → id 맵)
  const brands = await prisma.brand.findMany({
    select: { id: true, slug: true, name: true },
  });
  const slugToId = new Map(brands.map((b) => [b.slug, b.id]));

  // 모든 크롤링된 상품 로드
  const products = await prisma.product.findMany({
    where: { sourceUrl: { not: null } },
    select: { id: true, sourceUrl: true, brandId: true, name: true },
  });

  let reassigned = 0;
  let unchanged = 0;
  let unrecognized = 0;
  const actions: any[] = [];

  for (const p of products) {
    const targetSlug = inferBrandSlugFromUrl(p.sourceUrl);
    if (!targetSlug) {
      unrecognized++;
      continue;
    }
    const targetId = slugToId.get(targetSlug);
    if (!targetId) {
      unrecognized++;
      continue;
    }
    if (p.brandId === targetId) {
      unchanged++;
      continue;
    }
    await prisma.product.update({
      where: { id: p.id },
      data: { brandId: targetId },
    });
    reassigned++;
    if (actions.length < 20) {
      actions.push({ name: p.name.slice(0, 40), to: targetSlug });
    }
  }

  // 고아 브랜드 정리 (상품 0개 + seed 브랜드 아님)
  const KNOWN_SLUGS = new Set(
    HOST_TO_BRAND_SLUG.map((h) => h.slug).concat([
      "nike",
      "adidas",
      "new-balance",
      "musinsa-standard",
      "covernat",
      "thisisneverthat",
      "mahagrid",
      "ader-error",
      "stussy",
      "kangol",
      "carhartt-wip",
      "iab-studio",
    ])
  );

  const orphanBrands = await prisma.brand.findMany({
    where: { isActive: true },
    include: { _count: { select: { products: true } } },
  });
  const deactivated: string[] = [];
  for (const b of orphanBrands) {
    if (b._count.products === 0 && !KNOWN_SLUGS.has(b.slug)) {
      await prisma.brand.update({
        where: { id: b.id },
        data: { isActive: false },
      });
      deactivated.push(`${b.slug} (${b.name})`);
    }
  }

  return NextResponse.json({
    success: true,
    reassigned,
    unchanged,
    unrecognized,
    totalProducts: products.length,
    deactivatedBrands: deactivated,
    sampleActions: actions,
  });
}

export async function GET(req: NextRequest) {
  const key = req.headers.get("x-crawl-key") || req.nextUrl.searchParams.get("key");
  if (key !== "nkbus2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // sourceUrl 있는 상품이 현재 어떤 brand에 연결돼있는지 진단
  const products = await prisma.product.findMany({
    where: { sourceUrl: { not: null } },
    select: {
      id: true,
      sourceUrl: true,
      name: true,
      brand: { select: { slug: true, name: true } },
    },
    take: 100,
  });

  const diagnosis = products.map((p) => {
    const targetSlug = inferBrandSlugFromUrl(p.sourceUrl);
    return {
      name: p.name.slice(0, 40),
      currentBrand: p.brand.slug,
      inferredBrand: targetSlug,
      mismatch: targetSlug && targetSlug !== p.brand.slug,
    };
  });

  const mismatchCount = diagnosis.filter((d) => d.mismatch).length;

  return NextResponse.json({
    totalProductsWithSourceUrl: products.length,
    mismatchCount,
    sample: diagnosis.slice(0, 20),
  });
}
