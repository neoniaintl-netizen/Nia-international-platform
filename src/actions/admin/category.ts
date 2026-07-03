"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "./shared";

// ═══════════════════════════════════════
// CATEGORY ACTIONS
// ═══════════════════════════════════════

export async function createCategory(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await requireAdmin();
    const name = (formData.get("name") as string)?.trim();
    const slug = (formData.get("slug") as string)?.trim();
    const iconUrl = (formData.get("iconUrl") as string)?.trim() || null;
    const parentId = (formData.get("parentId") as string)?.trim() || null;
    const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;

    if (!name || !slug) return { error: "카테고리명과 slug는 필수입니다." };

    let depth = 0;
    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (parent) depth = parent.depth + 1;
    }

    await prisma.category.create({
      data: { name, slug, iconUrl, parentId, depth, sortOrder },
    });
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (e: any) {
    if (e.code === "P2002") return { error: "이미 존재하는 slug입니다." };
    return { error: e.message };
  }
}

export async function updateCategory(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await requireAdmin();
    const id = formData.get("id") as string;
    const name = (formData.get("name") as string)?.trim();
    const iconUrl = (formData.get("iconUrl") as string)?.trim() || null;
    const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;

    if (!name) return { error: "카테고리명은 필수입니다." };

    await prisma.category.update({
      where: { id },
      data: { name, iconUrl, sortOrder },
    });
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteCategory(categoryId: string) {
  await requireAdmin();
  const productCount = await prisma.product.count({ where: { categoryId } });
  if (productCount > 0) {
    return { error: `${productCount}개의 상품이 연결되어 있어 삭제할 수 없습니다.` };
  }
  const childCount = await prisma.category.count({ where: { parentId: categoryId } });
  if (childCount > 0) {
    return { error: "하위 카테고리가 있어 삭제할 수 없습니다." };
  }
  await prisma.category.delete({ where: { id: categoryId } });
  revalidatePath("/admin/categories");
  return { success: true };
}
