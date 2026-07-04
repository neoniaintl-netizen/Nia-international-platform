"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "./shared";
import {
  cancelPayment,
  formatFunpayAmount,
  toFunpayCharge,
  funpayServiceType,
  isFunpayConfigured,
  FUNPAY_SUCCESS_CODE,
} from "@/lib/payment/funpay";

function generateRefundRefno() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `RTN-${date}-${rand}`;
}

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
    include: { order: { include: { items: true, payment: true } } },
  });

  if (!returnReq) return { error: "반품 요청을 찾을 수 없습니다." };
  if (returnReq.status !== "PENDING") return { error: "처리할 수 없는 상태입니다." };

  const { order } = returnReq;

  // 크래시 복구 방어: 결제는 이미 REFUNDED 인데 실제 환불 확정(refundedAt) 기록이 없으면
  // 이전 시도가 환불 도중 중단된 것 → 실제 환불 여부 불명. 자동 완료 금지(무환불 반품완료 방지).
  // (refundedAt 이 있으면 아래 fresh 환불 블록을 건너뛰고 트랜잭션으로 낙하 → 자가치유)
  if (order.payment?.status === "REFUNDED" && !order.payment.refundedAt) {
    return {
      error: "이 반품은 환불 확정 여부 확인이 필요합니다. 결제 담당자 확인 후 처리해주세요.",
    };
  }

  // 결제 완료된 주문이면 Funpay 실제 환불 먼저 호출 (성공해야 반품 승인 진행)
  if (order.payment?.status === "COMPLETED" && order.payment.transactionId) {
    if (!isFunpayConfigured()) {
      return { error: "환불 설정이 완료되지 않았습니다. 결제 담당자에게 문의해주세요." };
    }
    // CAS 선점: 동시 승인 클릭으로 인한 이중 환불 방지
    const lock = await prisma.payment.updateMany({
      where: { id: order.payment.id, status: "COMPLETED" },
      data: { status: "REFUNDED", cancelledAt: new Date() },
    });
    if (lock.count === 0) {
      return { error: "이미 환불 처리 중이거나 완료되었습니다. 새로고침 후 확인해주세요." };
    }
    try {
      let refundCur: string;
      let refundAmt: string;
      if (order.payment.pgCurrency && order.payment.pgAmount != null) {
        refundCur = order.payment.pgCurrency;
        refundAmt = formatFunpayAmount(Number(order.payment.pgAmount), refundCur);
      } else {
        const charge = toFunpayCharge(order.finalAmount);
        refundCur = charge.reqcur;
        refundAmt = charge.reqamt;
      }
      const refundRes = await cancelPayment({
        refundRefno: generateRefundRefno(),
        transid: order.payment.transactionId,
        servicetype: funpayServiceType(order.paymentMethod ?? "ALIPAY"),
        reqcur: refundCur,
        reqamt: refundAmt,
        voidamt: refundAmt,
        reasoncode: "R001", // 하자/반품
      });
      const refundRaw = JSON.stringify({
        sentTransid: order.payment.transactionId,
        sentCur: refundCur,
        sentAmt: refundAmt,
        response: refundRes ?? null,
      });
      await prisma.payment.update({ where: { id: order.payment.id }, data: { refundRaw } });
      const code = String(refundRes?.rescode ?? refundRes?.resultcode ?? "");
      if (code !== FUNPAY_SUCCESS_CODE) {
        // 환불 실패 — 잠금 해제하여 재시도 가능하게 함
        await prisma.payment.update({
          where: { id: order.payment.id },
          data: { status: "COMPLETED", cancelledAt: null },
        });
        return { error: `반품 환불에 실패했습니다. (코드: ${code || "unknown"})` };
      }
      // 실제 환불 성공 확정 — refundedAt 기록(유일한 "환불됨" 진실 소스)
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: { refundedAt: new Date() },
      });
    } catch (e: any) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: { status: "COMPLETED", cancelledAt: null },
      });
      return { error: `환불 요청 중 오류가 발생했습니다. (${e?.message ?? "unknown"})` };
    }
  }

  let processed = false;
  await prisma.$transaction(async (tx) => {
    // CAS: PENDING → COMPLETED 전이를 이긴 요청만 후속 처리 (동시 승인 시 재고 이중복원 방지)
    const wonReturn = await tx.returnRequest.updateMany({
      where: { id: returnRequestId, status: "PENDING" },
      data: { status: "COMPLETED", processedAt: new Date() },
    });
    if (wonReturn.count === 0) return; // 그 사이 다른 요청이 이미 처리함
    processed = true;

    // Update order status
    await tx.order.update({
      where: { id: returnReq.orderId },
      data: { status: "RETURNED" },
    });

    // Update payment status (PG 환불이 필요 없었던 경우 대비 — 위에서 이미 REFUNDED 면 idempotent)
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

  if (!processed) {
    return { error: "이미 처리된 반품 요청입니다." };
  }

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
