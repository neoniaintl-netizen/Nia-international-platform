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

// ─── 주문 생성 (장바구니 → 주문) ───

export async function createOrder(_prevState: any, formData: FormData) {
  const userId = await getUserId();

  const recipient = formData.get("recipient") as string;
  const phone = formData.get("phone") as string;
  const zipCode = formData.get("zipCode") as string;
  const address1 = formData.get("address1") as string;
  const address2 = formData.get("address2") as string;
  const memo = formData.get("memo") as string;
  const paymentMethod = (formData.get("paymentMethod") as string) || "CARD";

  // Validation
  if (!recipient || !phone || !zipCode || !address1) {
    return { error: "배송 정보를 모두 입력해주세요." };
  }

  // 장바구니 조회
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

  // 금액 계산
  const totalAmount = cartItems.reduce((sum, item) => {
    const price = item.product.salePrice ?? item.product.originalPrice;
    return sum + price * item.quantity;
  }, 0);
  const shippingFee = totalAmount >= 30000 ? 0 : 3000;
  const discountAmount = 0;
  const finalAmount = totalAmount - discountAmount + shippingFee;

  // 배송지 저장
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

  // 주문 생성 (트랜잭션)
  const orderNumber = generateOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      addressId: address.id,
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

  // 장바구니 비우기
  await prisma.cartItem.deleteMany({ where: { userId } });

  revalidatePath("/cart");
  revalidatePath("/my");
  revalidatePath("/my/orders");

  redirect(`/checkout/complete?orderId=${order.id}`);
}

// ─── 주문 취소 ───

export async function cancelOrder(orderId: string) {
  const userId = await getUserId();

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
  });

  if (!order) return { error: "주문을 찾을 수 없습니다." };
  if (!["PAID", "PENDING", "PREPARING"].includes(order.status)) {
    return { error: "취소할 수 없는 주문 상태입니다." };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });

  // 결제 취소
  await prisma.payment.updateMany({
    where: { orderId },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  revalidatePath("/my/orders");
  revalidatePath("/my");
  return { success: true };
}
