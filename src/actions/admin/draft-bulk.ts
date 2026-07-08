"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "./shared";

/**
 * DRAFT 상품 일괄 처리 — 크롤링 검수용.
 * 안전가드: 승격/삭제 모두 status=DRAFT 인 것만 대상 (ACTIVE 오조작 방지).
 */

/** 선택한 DRAFT 상품을 ACTIVE 로 일괄 승격. */
export async function bulkPromoteDrafts(ids: string[]) {
  try {
    await requireAdmin();
    if (!ids.length) return { error: "선택된 상품이 없습니다." };
    const result = await prisma.product.updateMany({
      where: { id: { in: ids }, status: "DRAFT" },
      data: { status: "ACTIVE" },
    });
    revalidatePath("/admin/drafts");
    revalidatePath("/admin/products");
    revalidatePath("/products");
    return { success: true, count: result.count };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "승격 실패" };
  }
}

/** 선택한 DRAFT 상품을 일괄 삭제 (이미지/변형/태그 정리 후). DRAFT 만 삭제. */
export async function bulkDeleteDrafts(ids: string[]) {
  try {
    await requireAdmin();
    if (!ids.length) return { error: "선택된 상품이 없습니다." };
    // DRAFT 인 것만 (ACTIVE 는 이 경로로 삭제 금지)
    const drafts = await prisma.product.findMany({
      where: { id: { in: ids }, status: "DRAFT" },
      select: { id: true },
    });
    const draftIds = drafts.map((d) => d.id);
    if (!draftIds.length) return { error: "삭제 가능한 DRAFT 상품이 없습니다." };

    await prisma.productImage.deleteMany({ where: { productId: { in: draftIds } } });
    await prisma.productVariant.deleteMany({ where: { productId: { in: draftIds } } });
    await prisma.productTag.deleteMany({ where: { productId: { in: draftIds } } });
    await prisma.product.deleteMany({ where: { id: { in: draftIds } } });

    revalidatePath("/admin/drafts");
    revalidatePath("/admin/products");
    return { success: true, count: draftIds.length };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "삭제 실패" };
  }
}
