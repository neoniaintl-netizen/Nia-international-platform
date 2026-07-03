"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "./shared";

// ═══════════════════════════════════════
// ORDER ACTIONS
// ═══════════════════════════════════════

export async function updateOrderStatus(orderId: string, status: string, trackingData?: { trackingNumber?: string; trackingCarrier?: string }) {
  await requireAdmin();

  const updateData: any = { status: status as any };

  if (status === "SHIPPED") {
    updateData.shippedAt = new Date();
    if (trackingData?.trackingNumber) updateData.trackingNumber = trackingData.trackingNumber;
    if (trackingData?.trackingCarrier) updateData.trackingCarrier = trackingData.trackingCarrier;
  }
  if (status === "DELIVERED") {
    updateData.deliveredAt = new Date();
  }

  await prisma.order.update({
    where: { id: orderId },
    data: updateData,
  });

  revalidatePath("/admin/orders");
  revalidatePath("/my/orders");
  return { success: true };
}

export async function approveReturn(returnRequestId: string) {
  await requireAdmin();

  const returnReq = await prisma.returnRequest.findUnique({
    where: { id: returnRequestId },
    include: { order: { include: { items: true } } },
  });

  if (!returnReq) return { error: "반품 요청을 찾을 수 없습니다." };
  if (returnReq.status !== "PENDING") return { error: "처리할 수 없는 상태입니다." };

  await prisma.$transaction(async (tx) => {
    // Update return request
    await tx.returnRequest.update({
      where: { id: returnRequestId },
      data: { status: "COMPLETED", processedAt: new Date() },
    });

    // Update order status
    await tx.order.update({
      where: { id: returnReq.orderId },
      data: { status: "RETURNED" },
    });

    // Update payment status
    await tx.payment.updateMany({
      where: { orderId: returnReq.orderId },
      data: { status: "REFUNDED" },
    });

    // Restore stock
    for (const item of returnReq.order.items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
        await tx.product.updateMany({
          where: { id: item.productId, status: "SOLDOUT" },
          data: { status: "ACTIVE" },
        });
      }
    }
  });

  revalidatePath("/admin/orders");
  revalidatePath("/my/orders");
  return { success: true };
}

export async function rejectReturn(returnRequestId: string) {
  await requireAdmin();

  const returnReq = await prisma.returnRequest.findUnique({
    where: { id: returnRequestId },
  });

  if (!returnReq || returnReq.status !== "PENDING") return { error: "처리할 수 없는 상태입니다." };

  await prisma.$transaction([
    prisma.returnRequest.update({
      where: { id: returnRequestId },
      data: { status: "REJECTED", processedAt: new Date() },
    }),
    prisma.order.update({
      where: { id: returnReq.orderId },
      data: { status: "DELIVERED" },
    }),
  ]);

  revalidatePath("/admin/orders");
  return { success: true };
}
