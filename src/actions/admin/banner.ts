"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "./shared";

// ═══════════════════════════════════════
// BANNER ACTIONS
// ═══════════════════════════════════════

export async function createBanner(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await requireAdmin();
    const title = (formData.get("title") as string)?.trim();
    const subtitle = (formData.get("subtitle") as string)?.trim() || null;
    const imageUrl = (formData.get("imageUrl") as string)?.trim();
    const linkUrl = (formData.get("linkUrl") as string)?.trim() || null;
    const position = (formData.get("position") as string) || "HOME_MAIN";
    const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;
    const isActive = formData.get("isActive") === "on";

    if (!title || !imageUrl) return { error: "제목과 이미지 URL은 필수입니다." };

    await prisma.banner.create({
      data: { title, subtitle, imageUrl, linkUrl, position, sortOrder, isActive },
    });
    revalidatePath("/admin/banners");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteBanner(bannerId: string) {
  await requireAdmin();
  await prisma.banner.delete({ where: { id: bannerId } });
  revalidatePath("/admin/banners");
  return { success: true };
}

export async function toggleBannerActive(bannerId: string, isActive: boolean) {
  await requireAdmin();
  await prisma.banner.update({ where: { id: bannerId }, data: { isActive } });
  revalidatePath("/admin/banners");
  return { success: true };
}
