import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";

/**
 * POST /api/admin/purge-seed-products
 *   Body: { brands: string[] }
 *
 * 특정 브랜드의 seed-fallback sourceSite 상품 삭제 (관련 이미지/옵션 cascade).
 * 실제 크롤링 상품으로 교체하기 위한 정리 작업.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const brandSlugs: string[] = body?.brands;
  if (!brandSlugs?.length) {
    return NextResponse.json(
      { error: "brands 배열 필수" },
      { status: 400 }
    );
  }

  const brands = await prisma.brand.findMany({
    where: { slug: { in: brandSlugs } },
    select: { id: true, slug: true },
  });

  const summary: Record<string, { products: number; images: number; variants: number }> =
    {};

  for (const brand of brands) {
    // seed-fallback sourceSite 상품만 대상
    const products = await prisma.product.findMany({
      where: {
        brandId: brand.id,
        sourceSite: "seed-fallback",
      },
      select: { id: true },
    });

    const productIds = products.map((p) => p.id);
    if (productIds.length === 0) {
      summary[brand.slug] = { products: 0, images: 0, variants: 0 };
      continue;
    }

    const [imgDel, varDel, prodDel] = await prisma.$transaction([
      prisma.productImage.deleteMany({
        where: { productId: { in: productIds } },
      }),
      prisma.productVariant.deleteMany({
        where: { productId: { in: productIds } },
      }),
      prisma.product.deleteMany({
        where: { id: { in: productIds } },
      }),
    ]);

    summary[brand.slug] = {
      products: prodDel.count,
      images: imgDel.count,
      variants: varDel.count,
    };
  }

  return NextResponse.json({ success: true, summary });
}
