import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/admin/fix-broken-images
 *   Headers: { x-crawl-key: nkbus2026 }
 *
 * sourceSite = "seed-fallback" 상품의 깨진 이미지 URL을
 * 브랜드 컬러 + 상품명이 표시된 placehold.co 이미지로 일괄 교체.
 *
 * 크롤링 불가능한 6개 브랜드(Patagonia/Arcteryx/Kolon/Descente/Nike/Alo)의
 * 이미지 깨짐 상태를 프리미엄 톤의 프레임 이미지로 전환.
 */

// 브랜드별 색상 (placehold.co 배경/텍스트)
const BRAND_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  patagonia: { bg: "1a3a2e", fg: "ffffff", label: "PATAGONIA" },
  arcteryx: { bg: "0a0a0a", fg: "d4b88a", label: "ARC'TERYX" },
  kolonsport: { bg: "4a3324", fg: "d4b88a", label: "KOLON+SPORT" },
  descente: { bg: "c8102e", fg: "ffffff", label: "DESCENTE" },
  "nike-skims": { bg: "f5e6d3", fg: "0a0a0a", label: "NIKE+x+SKIMS" },
  aloyoga: { bg: "2c2c2c", fg: "d4b88a", label: "ALO+YOGA" },
};

function placeholderUrl(
  brandSlug: string,
  productName: string,
  variant: number = 1
): string {
  const style = BRAND_STYLE[brandSlug];
  if (!style) {
    return `https://placehold.co/800x1000/F5F2EC/6B6B6B?text=${encodeURIComponent(productName.slice(0, 20))}`;
  }
  // 여러 이미지 슬롯을 위한 약간씩 다른 이미지
  const variantSuffix = variant > 1 ? `+0${variant}` : "";
  return `https://placehold.co/800x1000/${style.bg}/${style.fg}?font=inter&text=${style.label}${variantSuffix}`;
}

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-crawl-key");
  if (key !== "nkbus2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 대상: seed-fallback 상품 중 위의 6개 브랜드
  const targetSlugs = Object.keys(BRAND_STYLE);
  const brands = await prisma.brand.findMany({
    where: { slug: { in: targetSlugs } },
    select: { id: true, slug: true },
  });
  const slugById = new Map(brands.map((b) => [b.id, b.slug]));

  const products = await prisma.product.findMany({
    where: {
      sourceSite: "seed-fallback",
      brandId: { in: brands.map((b) => b.id) },
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  const summary = {
    products: products.length,
    imagesReplaced: 0,
    imagesAdded: 0,
    errors: [] as string[],
  };

  for (const p of products) {
    const brandSlug = slugById.get(p.brandId);
    if (!brandSlug) continue;

    try {
      // 3장 이미지로 교체 (메인 + 추가 2장)
      const newImages = [1, 2, 3].map((i) => ({
        url: placeholderUrl(brandSlug, p.name, i),
        alt: p.name,
      }));

      // 기존 이미지 전부 삭제
      const delCount = await prisma.productImage.deleteMany({
        where: { productId: p.id },
      });
      summary.imagesReplaced += delCount.count;

      // 새 이미지 추가
      await prisma.productImage.createMany({
        data: newImages.map((img, i) => ({
          productId: p.id,
          url: img.url,
          alt: img.alt,
          sortOrder: i,
          isMain: i === 0,
        })),
      });
      summary.imagesAdded += newImages.length;
    } catch (err: any) {
      summary.errors.push(`${p.name}: ${err.message}`);
    }
  }

  return NextResponse.json({ success: true, summary });
}
