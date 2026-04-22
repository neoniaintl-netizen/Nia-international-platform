"use server";

import { prisma } from "@/lib/db";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "결제 대기",
  PAID: "결제 완료",
  PREPARING: "배송 준비중",
  SHIPPED: "배송중",
  DELIVERED: "배송 완료",
  CANCELLED: "주문 취소",
  RETURN_REQUESTED: "반품 접수",
  RETURNED: "반품 완료",
};

export async function lookupOrderAction(_prev: any, formData: FormData) {
  const orderNumber = (formData.get("orderNumber") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();

  if (!orderNumber || !email) {
    return { error: "주문번호와 이메일을 입력해주세요." };
  }

  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      user: { email },
    },
    include: {
      items: {
        select: {
          id: true,
          productName: true,
          brandName: true,
          imageUrl: true,
          quantity: true,
          totalPrice: true,
          size: true,
          color: true,
        },
      },
      address: {
        select: {
          recipient: true,
          phone: true,
          address1: true,
          address2: true,
          zipCode: true,
        },
      },
    },
  });

  if (!order) {
    return {
      error:
        "주문번호와 이메일이 일치하는 주문을 찾을 수 없습니다. 다시 확인해주세요.",
    };
  }

  return {
    success: true,
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      statusLabel: STATUS_LABEL[order.status] ?? order.status,
      createdAt: order.createdAt.toISOString().split("T")[0],
      finalAmount: order.finalAmount,
      trackingNumber: order.trackingNumber,
      trackingCarrier: order.trackingCarrier,
      items: order.items,
      address: order.address,
    },
  };
}
