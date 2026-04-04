"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.");
  return session.user.id;
}

function generateOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORD-${date}-${rand}`;
}

export async function createOrder(_prevState: any, formData: FormData) {
  const userId = await getUserId();

  const recipient = formData.get("recipient") as string;
  const phone = formData.get("phone") as string;
  const zipCode = formData.get("zipCode") as string;
  const address1 = formData.get("address1") as string;
  const address2 = formData.get("address2") as string;
  const memo = formData.get("memo") as string;
  const paymentMethod = (formData.get("paymentMethod") as string) || "CARD";
  const couponCode = (formData.get("couponCode") as string)?.trim() || null;
  const usedPoints = parseInt(formData.get("usedPoints") as string) || 0;

  if (!recipient || !phone || !zipCode || !address1) {
    return { error: "배송 정보를 모두 입력해주세요." };
  }

  // Cart items
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          brand: { select: { name: true } },
          images: { where: { isMain: true }, take: 1 },
        },
      },
      variant: true,
    },
  });

  if (cartItems.length === 0) {
    return { error: "장바구니가 비어있습니다." };
  }

  // Calculate subtotal
  const totalAmount = cartItems.reduce((sum, item) => {
    const price = item.product.salePrice ?? item.product.originalPrice;
    return sum + price * item.quantity;
  }, 0);
  const shippingFee = totalAmount >= 30000 ? 0 : 3000;

  // --- Coupon validation ---
  let couponDiscount = 0;
  let validCoupon: any = null;
  let validUserCoupon: any = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (!coupon) return { error: "유효하지 않은 쿠폰 코드입니다." };
    if (!coupon.isActive) return { error: "비활성화된 쿠폰입니다." };

    const now = new Date();
    if (now < coupon.startsAt || now > coupon.expiresAt) return { error: "쿠폰 사용 기간이 아닙니다." };
    if (coupon.totalQuantity && coupon.usedCount >= coupon.totalQuantity) return { error: "쿠폰이 모두 소진되었습니다." };
    if (coupon.minOrderAmount && totalAmount < coupon.minOrderAmount) {
      return { error: `최소 주문금액 ${coupon.minOrderAmount.toLocaleString()}원 이상이어야 합니다.` };
    }

    const userCoupon = await prisma.userCoupon.findFirst({
      where: { userId, couponId: coupon.id, usedAt: null },
    });
    if (!userCoupon) return { error: "보유하지 않은 쿠폰이거나 이미 사용된 쿠폰입니다." };

    if (coupon.discountType === "PERCENTAGE") {
      couponDiscount = Math.floor(totalAmount * (coupon.discountValue / 100));
      if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
        couponDiscount = coupon.maxDiscount;
      }
    } else {
      couponDiscount = coupon.discountValue;
    }

    validCoupon = coupon;
    validUserCoupon = userCoupon;
  }

  // --- Points validation ---
  let pointsDiscount = 0;
  if (usedPoints > 0) {
    const currentPoints = await prisma.pointHistory.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    const balance = currentPoints._sum.amount ?? 0;
    if (usedPoints > balance) return { error: "보유 적립금이 부족합니다." };
    const maxUsable = totalAmount - couponDiscount;
    if (usedPoints > maxUsable) return { error: "적립금은 상품 금액을 초과할 수 없습니다." };
    pointsDiscount = usedPoints;
  }

  const discountAmount = couponDiscount + pointsDiscount;
  const finalAmount = totalAmount - discountAmount + shippingFee;

  // --- Stock validation ---
  for (const item of cartItems) {
    if (item.variantId && item.variant) {
      if (item.variant.stock < item.quantity) {
        return { error: `"${item.product.name}" (${item.variant.size || ""} ${item.variant.color || ""}) 재고가 부족합니다. (남은 수량: ${item.variant.stock}개)` };
      }
    }
  }

  // --- Transaction: create order + stock decrement + coupon/points ---
  const address = await prisma.address.create({
    data: {
      userId,
      label: "주문 배송지",
      recipient,
      phone,
      zipCode,
      address1,
      address2: address2 || null,
      isDefault: false,
    },
  });

  const orderNumber = generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    // 1. Stock decrement
    for (const item of cartItems) {
      if (item.variantId) {
        const variant = await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
        // If stock is now 0, check if all variants are sold out
        if (variant.stock <= 0) {
          const activeVariants = await tx.productVariant.count({
            where: { productId: item.productId, stock: { gt: 0 } },
          });
          if (activeVariants === 0) {
            await tx.product.update({
              where: { id: item.productId },
              data: { status: "SOLDOUT" },
            });
          }
        }
      }
    }

    // 2. Create order
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId,
        addressId: address.id,
        couponId: validCoupon?.id || null,
        status: "PAID",
        totalAmount,
        discountAmount,
        shippingFee,
        finalAmount,
        paymentMethod: paymentMethod as any,
        paidAt: new Date(),
        note: memo || null,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.product.name,
            brandName: item.product.brand.name,
            imageUrl: item.product.images[0]?.url ?? null,
            color: item.variant?.color ?? null,
            size: item.variant?.size ?? null,
            quantity: item.quantity,
            unitPrice: item.product.salePrice ?? item.product.originalPrice,
            totalPrice: (item.product.salePrice ?? item.product.originalPrice) * item.quantity,
          })),
        },
        payment: {
          create: {
            method: paymentMethod as any,
            status: "COMPLETED",
            amount: finalAmount,
            transactionId: `TXN-${Date.now()}`,
            paidAt: new Date(),
          },
        },
      },
    });

    // 3. Mark coupon as used
    if (validUserCoupon) {
      await tx.userCoupon.update({
        where: { id: validUserCoupon.id },
        data: { usedAt: new Date() },
      });
      await tx.coupon.update({
        where: { id: validCoupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    // 4. Deduct points
    if (pointsDiscount > 0) {
      const currentBalance = (await tx.pointHistory.aggregate({
        where: { userId },
        _sum: { amount: true },
      }))._sum.amount ?? 0;

      await tx.pointHistory.create({
        data: {
          userId,
          amount: -pointsDiscount,
          balance: currentBalance - pointsDiscount,
          type: "USE_ORDER",
          description: `주문 사용 (${orderNumber})`,
        },
      });
    }

    // 5. Earn points (1% of finalAmount)
    const earnPoints = Math.floor(finalAmount * 0.01);
    if (earnPoints > 0) {
      const currentBalance2 = (await tx.pointHistory.aggregate({
        where: { userId },
        _sum: { amount: true },
      }))._sum.amount ?? 0;

      await tx.pointHistory.create({
        data: {
          userId,
          amount: earnPoints,
          balance: currentBalance2 + earnPoints,
          type: "EARN_PURCHASE",
          description: `구매 적립 (${orderNumber})`,
        },
      });
    }

    return newOrder;
  });

  // Clear cart
  await prisma.cartItem.deleteMany({ where: { userId } });

  revalidatePath("/cart");
  revalidatePath("/my");
  revalidatePath("/my/orders");

  redirect(`/checkout/complete?orderId=${order.id}`);
}

// --- Cancel order (with stock restoration) ---
export async function cancelOrder(orderId: string) {
  const userId = await getUserId();

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true },
  });

  if (!order) return { error: "주문을 찾을 수 없습니다." };
  if (!["PAID", "PENDING", "PREPARING"].includes(order.status)) {
    return { error: "취소할 수 없는 주문 상태입니다." };
  }

  await prisma.$transaction(async (tx) => {
    // Restore stock
    for (const item of order.items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
        // If product was SOLDOUT, set back to ACTIVE
        await tx.product.updateMany({
          where: { id: item.productId, status: "SOLDOUT" },
          data: { status: "ACTIVE" },
        });
      }
    }

    // Cancel order
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    // Cancel payment
    await tx.payment.updateMany({
      where: { orderId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    // Restore points if used
    if (order.discountAmount > 0) {
      // Check if points were used (there should be a USE_ORDER record)
      const pointUsage = await tx.pointHistory.findFirst({
        where: { userId, type: "USE_ORDER", description: { contains: order.orderNumber } },
      });
      if (pointUsage) {
        const currentBalance = (await tx.pointHistory.aggregate({
          where: { userId },
          _sum: { amount: true },
        }))._sum.amount ?? 0;

        await tx.pointHistory.create({
          data: {
            userId,
            amount: Math.abs(pointUsage.amount),
            balance: currentBalance + Math.abs(pointUsage.amount),
            type: "ADMIN_ADJUST",
            description: `주문 취소 환불 (${order.orderNumber})`,
          },
        });
      }
    }

    // Restore coupon if used
    if (order.couponId) {
      await tx.userCoupon.updateMany({
        where: { userId, couponId: order.couponId },
        data: { usedAt: null },
      });
      await tx.coupon.update({
        where: { id: order.couponId },
        data: { usedCount: { decrement: 1 } },
      });
    }
  });

  revalidatePath("/my/orders");
  revalidatePath("/my");
  return { success: true };
}
