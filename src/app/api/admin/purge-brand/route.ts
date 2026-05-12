import { NextRequest, NextResponse } from "next/server";
import { requireOpsToken } from "@/lib/ops-auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/admin/purge-brand
 *   Headers: { x-ops-token: <ADMIN_OPS_TOKEN> }
 *   Body: { brands: string[] }  // slug 배열 (예: ["musinsa-standard"])
 *
 * 특정 브랜드의 모든 상품/이미지/옵션/장바구니/위시리스트 항목을 cascade 삭제.
 * 주문 항목(OrderItem)은 스냅샷 데이터라 유지.
 * Brand 레코드 자체는 isActive=false로 soft delete.
 *
 * 또한 brand 이름에 해당하는 문자열 기반 추가 탐색 가능:
 *   Body: { brandNames: string[] }  // 예: ["무신사"]
 *   → 이름에 포함된 모든 브랜드 soft delete
 */
export async function POST(req: NextRequest) {
  const block = requireOpsToken(req);
  if (block) return block;

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const slugs: string[] = body?.brands ?? [];
  const nameQueries: string[] = body?.brandNames ?? [];

  if (slugs.length === 0 && nameQueries.length === 0) {
    return NextResponse.json(
      { error: "brands 또는 brandNames 배열 필요" },
      { status: 400 }
    );
  }

  // 대상 브랜드 조회 (slug + name 검색)
  const targets = await prisma.brand.findMany({
    where: {
      OR: [
        { slug: { in: slugs } },
        ...nameQueries.flatMap((q) => [
          { name: { contains: q, mode: "insensitive" as const } },
          { nameKo: { contains: q, mode: "insensitive" as const } },
        ]),
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      nameKo: true,
      _count: { select: { products: true } },
    },
  });

  if (targets.length === 0) {
    return NextResponse.json({ error: "대상 브랜드 없음", queries: { slugs, nameQueries } }, { status: 404 });
  }

  const result: any[] = [];

  for (const brand of targets) {
    const products = await prisma.product.findMany({
      where: { brandId: brand.id },
      select: { id: true },
    });
    const productIds = products.map((p) => p.id);

    const counts = { images: 0, variants: 0, wishlist: 0, cart: 0, products: 0 };

    if (productIds.length > 0) {
      const [imgDel, varDel, wishDel, cartDel] = await prisma.$transaction([
        prisma.productImage.deleteMany({ where: { productId: { in: productIds } } }),
        prisma.productVariant.deleteMany({ where: { productId: { in: productIds } } }),
        prisma.wishlistItem.deleteMany({ where: { productId: { in: productIds } } }),
        prisma.cartItem.deleteMany({ where: { productId: { in: productIds } } }),
      ]);
      counts.images = imgDel.count;
      counts.variants = varDel.count;
      counts.wishlist = wishDel.count;
      counts.cart = cartDel.count;

      // ProductTag, Review, ProductInquiry도 삭제
      await prisma.productTag.deleteMany({ where: { productId: { in: productIds } } });
      await prisma.review.deleteMany({ where: { productId: { in: productIds } } });
      await prisma.productInquiry.deleteMany({ where: { productId: { in: productIds } } });
      await prisma.eventProduct.deleteMany({ where: { productId: { in: productIds } } });
      await prisma.lookbookProduct.deleteMany({ where: { productId: { in: productIds } } });

      const prodDel = await prisma.product.deleteMany({
        where: { id: { in: productIds } },
      });
      counts.products = prodDel.count;
    }

    // Brand 자체 soft delete (주문 이력이 참조할 수 있으므로 hard delete 안 함)
    await prisma.brand.update({
      where: { id: brand.id },
      data: { isActive: false },
    });

    result.push({
      slug: brand.slug,
      name: brand.name,
      nameKo: brand.nameKo,
      deleted: counts,
      brandSoftDeleted: true,
    });
  }

  return NextResponse.json({ success: true, result });
}
