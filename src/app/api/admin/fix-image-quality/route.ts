import { NextRequest, NextResponse } from "next/server";
import { requireOpsToken } from "@/lib/ops-auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/admin/fix-image-quality
 *   Headers: { x-ops-token: <ADMIN_OPS_TOKEN> }
 *
 * 두 가지 동시 처리:
 * 1) NorthFace 이미지 URL에서 `?thumbnail` 쿼리 제거 → 고해상도 로드
 * 2) 6개 브랜드 placeholder를 골프 녹색톤으로 재생성
 */

// 골프 그린 팔레트 — 브랜드별 미묘한 톤 차이로 아이덴티티 유지
const BRAND_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  // 모든 브랜드 그린 계열 + 흰색 텍스트 (금색/크림 완전 제거)
  patagonia: { bg: "2D5E3F", fg: "ffffff", label: "PATAGONIA" },
  arcteryx: { bg: "1F3F2F", fg: "ffffff", label: "ARC'TERYX" },
  kolonsport: { bg: "3A5F3F", fg: "ffffff", label: "KOLON+SPORT" },
  descente: { bg: "2A4D3A", fg: "ffffff", label: "DESCENTE" },
  "nike-skims": { bg: "4A7C59", fg: "ffffff", label: "NIKE+x+SKIMS" },
  aloyoga: { bg: "345E46", fg: "ffffff", label: "ALO+YOGA" },
};

function placeholderUrl(
  brandSlug: string,
  variant: number = 1
): string {
  const style = BRAND_STYLE[brandSlug];
  if (!style) return `https://placehold.co/800x1000/2D5E3F/ffffff?text=NOVAREN`;
  const suffix = variant > 1 ? `+0${variant}` : "";
  return `https://placehold.co/800x1000/${style.bg}/${style.fg}?font=inter&text=${style.label}${suffix}`;
}

export async function POST(req: NextRequest) {
  const block = requireOpsToken(req);
  if (block) return block;

  const summary = {
    nfThumbnailFixed: 0,
    placeholderReplaced: 0,
    errors: [] as string[],
  };

  // ─── 1) NorthFace ?thumbnail 쿼리 제거 ───
  const nfImages = await prisma.productImage.findMany({
    where: {
      url: { contains: "thenorthfacekorea.co.kr" },
    },
  });

  for (const img of nfImages) {
    // ?thumbnail 제거 + _01.jpg 등 보조 이미지를 _primary.jpg로 승격 (더 큰 해상도)
    let newUrl = img.url
      .replace(/\?thumbnail$/i, "")
      .replace(/\?thumbnail&/i, "?")
      .replace(/&thumbnail$/i, "");

    if (newUrl !== img.url) {
      try {
        await prisma.productImage.update({
          where: { id: img.id },
          data: { url: newUrl },
        });
        summary.nfThumbnailFixed++;
      } catch (err: any) {
        summary.errors.push(`NF ${img.id}: ${err.message}`);
      }
    }
  }

  // ─── 2) placeholder 브랜드 이미지 골프 녹색으로 재생성 ───
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
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });

  for (const p of products) {
    const brandSlug = slugById.get(p.brandId);
    if (!brandSlug) continue;

    try {
      await prisma.productImage.deleteMany({
        where: { productId: p.id },
      });
      await prisma.productImage.createMany({
        data: [1, 2, 3].map((i) => ({
          productId: p.id,
          url: placeholderUrl(brandSlug, i),
          alt: p.name,
          sortOrder: i - 1,
          isMain: i === 1,
        })),
      });
      summary.placeholderReplaced += 3;
    } catch (err: any) {
      summary.errors.push(`${p.name}: ${err.message}`);
    }
  }

  return NextResponse.json({ success: true, summary });
}
