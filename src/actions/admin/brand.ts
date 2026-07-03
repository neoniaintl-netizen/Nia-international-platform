"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "./shared";

// ═══════════════════════════════════════
// BRAND ACTIONS
// ═══════════════════════════════════════

export async function createBrand(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await requireAdmin();
    const name = (formData.get("name") as string)?.trim();
    const nameKo = (formData.get("nameKo") as string)?.trim() || null;
    const slug = (formData.get("slug") as string)?.trim();
    const logoUrl = (formData.get("logoUrl") as string)?.trim() || null;
    const description = (formData.get("description") as string)?.trim() || null;

    if (!name || !slug) return { error: "브랜드명과 slug는 필수입니다." };

    await prisma.brand.create({
      data: { name, nameKo, slug, logoUrl, description },
    });
    revalidatePath("/admin/brands");
    return { success: true };
  } catch (e: any) {
    if (e.code === "P2002") return { error: "이미 존재하는 브랜드명 또는 slug입니다." };
    return { error: e.message };
  }
}

export async function updateBrand(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await requireAdmin();
    const id = formData.get("id") as string;
    const name = (formData.get("name") as string)?.trim();
    const nameKo = (formData.get("nameKo") as string)?.trim() || null;
    const logoUrl = (formData.get("logoUrl") as string)?.trim() || null;
    const description = (formData.get("description") as string)?.trim() || null;
    const isActive = formData.get("isActive") === "on";

    if (!name) return { error: "브랜드명은 필수입니다." };

    await prisma.brand.update({
      where: { id },
      data: { name, nameKo, logoUrl, description, isActive },
    });
    revalidatePath("/admin/brands");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteBrand(brandId: string) {
  await requireAdmin();
  const productCount = await prisma.product.count({ where: { brandId } });
  if (productCount > 0) {
    return { error: `${productCount}개의 상품이 연결되어 있어 삭제할 수 없습니다.` };
  }
  await prisma.brand.delete({ where: { id: brandId } });
  revalidatePath("/admin/brands");
  return { success: true };
}
