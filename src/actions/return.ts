"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.");
  return session.user.id;
}

export async function requestReturn(_prevState: any, formData: FormData) {
  const userId = await getUserId();
  const orderId = formData.get("orderId") as string;
  const reason = formData.get("reason") as string;
  const description = (formData.get("description") as string)?.trim() || null;

  if (!orderId || !reason) return { error: "반품 사유를 선택해주세요." };

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
  });

  if (!order) return { error: "주문을 찾을 수 없습니다." };
  if (!["DELIVERED", "SHIPPED"].includes(order.status)) {
    return { error: "반품 요청이 불가능한 주문 상태입니다." };
  }

  // Check if return already exists
  const existing = await prisma.returnRequest.findFirst({
    where: { orderId, status: { in: ["PENDING", "APPROVED"] } },
  });
  if (existing) return { error: "이미 반품 요청이 진행 중입니다." };

  await prisma.$transaction([
    prisma.returnRequest.create({
      data: {
        orderId,
        userId,
        reason,
        description,
        refundAmount: order.finalAmount,
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { status: "RETURN_REQUESTED" },
    }),
  ]);

  revalidatePath("/my/orders");
  return { success: true };
}

export async function cancelReturnRequest(returnRequestId: string) {
  const userId = await getUserId();

  const returnReq = await prisma.returnRequest.findFirst({
    where: { id: returnRequestId, userId, status: "PENDING" },
    include: { order: true },
  });

  if (!returnReq) return { error: "반품 요청을 찾을 수 없습니다." };

  await prisma.$transaction([
    prisma.returnRequest.update({
      where: { id: returnRequestId },
      data: { status: "REJECTED" },
    }),
    prisma.order.update({
      where: { id: returnReq.orderId },
      data: { status: "DELIVERED" },
    }),
  ]);

  revalidatePath("/my/orders");
  return { success: true };
}
