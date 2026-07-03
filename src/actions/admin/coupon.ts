"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "./shared";

// ═══════════════════════════════════════
// COUPON ACTIONS
// ═══════════════════════════════════════

export async function createCoupon(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await requireAdmin();
    const code = (formData.get("code") as string)?.trim();
    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const discountType = formData.get("discountType") as string;
    const discountValue = parseInt(formData.get("discountValue") as string) || 0;
    const minOrderAmount = parseInt(formData.get("minOrderAmount") as string) || null;
    const maxDiscount = parseInt(formData.get("maxDiscount") as string) || null;
    const totalQuantity = parseInt(formData.get("totalQuantity") as string) || null;
    const startsAt = new Date(formData.get("startsAt") as string);
    const expiresAt = new Date(formData.get("expiresAt") as string);

    if (!code || !name || !discountValue) return { error: "필수 항목을 입력해주세요." };

    await prisma.coupon.create({
      data: {
        code,
        name,
        description,
        discountType: discountType as any,
        discountValue,
        minOrderAmount,
        maxDiscount,
        totalQuantity,
        startsAt,
        expiresAt,
      },
    });
    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (e: any) {
    if (e.code === "P2002") return { error: "이미 존재하는 쿠폰 코드입니다." };
    return { error: e.message };
  }
}

export async function deleteCoupon(couponId: string) {
  await requireAdmin();
  await prisma.userCoupon.deleteMany({ where: { couponId } });
  await prisma.coupon.delete({ where: { id: couponId } });
  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function toggleCouponActive(couponId: string, isActive: boolean) {
  await requireAdmin();
  await prisma.coupon.update({ where: { id: couponId }, data: { isActive } });
  revalidatePath("/admin/coupons");
  return { success: true };
}
