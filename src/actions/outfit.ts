"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "./admin/shared";

const ROLES = ["TOP", "BOTTOM", "OUTER", "SHOES", "ACC"] as const;

// ─── 코디(OUTFIT) 생성 ───
export async function createOutfitAction(_prev: unknown, formData: FormData) {
  await requireAdmin();

  const title = (formData.get("title") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim();
  const subtitle = (formData.get("subtitle") as string)?.trim() || null;
  const season = (formData.get("season") as string)?.trim() || null;
  const gender = (formData.get("gender") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const coverImage = (formData.get("coverImage") as string)?.trim() || null;

  if (!title || !slug) {
    return { error: "제목과 slug는 필수입니다." };
  }

  try {
    const outfit = await prisma.lookbook.create({
      data: {
        title,
        slug,
        subtitle,
        season,
        gender,
        description,
        // 커버 미입력 시 임시로 빈 문자열 저장 → 상세는 상품 콜라주로 fallback.
        // 첫 아이템 추가 시 자동으로 대표 이미지를 채운다(addOutfitItemAction).
        coverImage: coverImage ?? "",
        kind: "OUTFIT",
        isPublished: false, // 아이템 담기 전이므로 기본 비공개
      },
    });
    revalidatePath("/admin/outfits");
    revalidatePath("/outfits");
    return { success: true, id: outfit.id };
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.code === "P2002") return { error: "이미 존재하는 slug입니다." };
    return { error: e.message ?? "생성 실패" };
  }
}

// ─── 커버 이미지 교체 (파일 업로드 후 URL 저장) ───
export async function updateOutfitCoverAction(id: string, coverImage: string) {
  await requireAdmin();
  await prisma.lookbook.update({ where: { id }, data: { coverImage } });
  revalidatePath("/admin/outfits");
  revalidatePath(`/admin/outfits/${id}`);
  revalidatePath("/outfits");
  return { success: true };
}

// ─── 아이템(상품) 추가 — 역할 지정 ───
export async function addOutfitItemAction(
  outfitId: string,
  productId: string,
  role: string
) {
  await requireAdmin();
  const validRole = (ROLES as readonly string[]).includes(role) ? role : null;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: { where: { isMain: true }, take: 1 } },
  });
  if (!product) return { error: "상품을 찾을 수 없습니다." };

  try {
    const maxOrder = await prisma.lookbookProduct.aggregate({
      where: { lookbookId: outfitId },
      _max: { sortOrder: true },
    });
    await prisma.lookbookProduct.create({
      data: {
        lookbookId: outfitId,
        productId: product.id,
        role: validRole,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });

    // 커버가 비어있으면 첫 상품 대표 이미지로 자동 채움
    const outfit = await prisma.lookbook.findUnique({
      where: { id: outfitId },
      select: { coverImage: true },
    });
    if (outfit && !outfit.coverImage && product.images[0]?.url) {
      await prisma.lookbook.update({
        where: { id: outfitId },
        data: { coverImage: product.images[0].url },
      });
    }

    revalidatePath(`/admin/outfits/${outfitId}`);
    revalidatePath("/outfits");
    return { success: true };
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.code === "P2002") return { error: "이미 추가된 상품입니다." };
    return { error: e.message ?? "추가 실패" };
  }
}

// ─── 아이템 역할 변경 ───
export async function updateOutfitItemRoleAction(itemId: string, role: string) {
  await requireAdmin();
  const validRole = (ROLES as readonly string[]).includes(role) ? role : null;
  const item = await prisma.lookbookProduct.update({
    where: { id: itemId },
    data: { role: validRole },
    select: { lookbookId: true },
  });
  revalidatePath(`/admin/outfits/${item.lookbookId}`);
  revalidatePath("/outfits");
  return { success: true };
}

// ─── 아이템 삭제 ───
export async function removeOutfitItemAction(itemId: string) {
  await requireAdmin();
  const item = await prisma.lookbookProduct.delete({
    where: { id: itemId },
    select: { lookbookId: true },
  });
  // 마지막 아이템을 빼면 공개 해제 — 빈 코디가 공개 상태로 남지 않도록
  const remaining = await prisma.lookbookProduct.count({
    where: { lookbookId: item.lookbookId },
  });
  if (remaining === 0) {
    await prisma.lookbook.update({
      where: { id: item.lookbookId },
      data: { isPublished: false },
    });
  }
  revalidatePath(`/admin/outfits/${item.lookbookId}`);
  revalidatePath("/outfits");
  return { success: true };
}

// ─── 공개 토글 / 삭제 ───
export async function toggleOutfitPublishAction(id: string) {
  await requireAdmin();
  const lb = await prisma.lookbook.findUnique({ where: { id }, select: { isPublished: true, _count: { select: { products: true } } } });
  if (!lb) return { error: "코디를 찾을 수 없습니다." };
  if (!lb.isPublished && lb._count.products === 0) {
    return { error: "아이템을 1개 이상 추가한 뒤 공개할 수 있습니다." };
  }
  await prisma.lookbook.update({ where: { id }, data: { isPublished: !lb.isPublished } });
  revalidatePath("/admin/outfits");
  revalidatePath("/outfits");
  return { success: true, isPublished: !lb.isPublished };
}

export async function deleteOutfitAction(id: string) {
  await requireAdmin();
  await prisma.lookbook.delete({ where: { id } });
  revalidatePath("/admin/outfits");
  revalidatePath("/outfits");
  return { success: true };
}

// ─── 상품 검색 (관리자 피커용) ───
export async function searchProductsForOutfitAction(q: string) {
  await requireAdmin();
  const query = q.trim();
  if (query.length < 1) return { products: [] };
  const products = await prisma.product.findMany({
    where: {
      status: { in: ["ACTIVE", "SOLDOUT"] },
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { slug: { contains: query, mode: "insensitive" } },
        { brand: { name: { contains: query, mode: "insensitive" } } },
      ],
    },
    take: 12,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      originalPrice: true,
      salePrice: true,
      brand: { select: { name: true } },
      images: { where: { isMain: true }, take: 1, select: { url: true } },
      category: { select: { slug: true } },
    },
  });
  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      brandName: p.brand.name,
      price: p.salePrice ?? p.originalPrice,
      imageUrl: p.images[0]?.url ?? null,
      categorySlug: p.category.slug,
    })),
  };
}
