"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function applyCouponCode(couponCode: string, orderAmount: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "로그인이 필요합니다." };

  const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
  if (!coupon) return { error: "유효하지 않은 쿠폰 코드입니다." };
  if (!coupon.isActive) return { error: "비활성화된 쿠폰입니다." };

  const now = new Date();
  if (now < coupon.startsAt || now > coupon.expiresAt) return { error: "쿠폰 사용 기간이 아닙니다." };
  if (coupon.totalQuantity && coupon.usedCount >= coupon.totalQuantity) return { error: "쿠폰이 모두 소진되었습니다." };
  if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
    return { error: `최소 주문금액 ${coupon.minOrderAmount.toLocaleString()}원 이상이어야 합니다.` };
  }

  const userCoupon = await prisma.userCoupon.findFirst({
    where: { userId: session.user.id, couponId: coupon.id, usedAt: null },
  });
  if (!userCoupon) return { error: "보유하지 않은 쿠폰이거나 이미 사용한 쿠폰입니다." };

  let discount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    discount = Math.floor(orderAmount * (coupon.discountValue / 100));
    if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
  } else {
    discount = coupon.discountValue;
  }

  return {
    success: true,
    discount,
    couponName: coupon.name,
    couponCode: coupon.code,
  };
}

export async function getUserAvailableCoupons() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const now = new Date();
  return prisma.userCoupon.findMany({
    where: {
      userId: session.user.id,
      usedAt: null,
      coupon: {
        isActive: true,
        startsAt: { lte: now },
        expiresAt: { gte: now },
      },
    },
    include: { coupon: true },
    orderBy: { issuedAt: "desc" },
  });
}
