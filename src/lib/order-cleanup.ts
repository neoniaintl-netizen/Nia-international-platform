import { prisma } from "@/lib/db";
import { restoreOrderResources } from "@/lib/order-restore";

/**
 * 방치된 PENDING 주문 자동 정리.
 *
 * 고객이 PG 결제창에서 이탈하면 노티가 영영 오지 않아 주문이 PENDING 으로 남고,
 * 차감된 재고·쿠폰·포인트가 영구히 잠긴다. 이를 주기적으로 취소+복원한다.
 *
 * - 기준: 생성 후 120분 경과 (Funpay 노티 재시도 최대 55분보다 충분히 김)
 * - 안전장치: payment.status 가 COMPLETED 인 주문은 절대 건드리지 않고 로그만 남김
 *   (돈은 받았는데 주문이 PENDING = 데이터 불일치 → 수동 확인 필요)
 * - 상태 전이는 CAS(updateMany + status 조건)라 노티/취소와 경합해도 안전
 * - 트리거: cron 없이 createOrder 에서 기회적으로 호출 (인스턴스당 5분 스로틀)
 */

const STALE_MINUTES = 120;
const BATCH_SIZE = 20;
const SWEEP_THROTTLE_MS = 5 * 60 * 1000;

let lastSweepAt = 0;

/** 스로틀 포함 — createOrder 등에서 fire-and-forget 으로 호출 */
export function sweepStalePendingOrders(): void {
  const now = Date.now();
  if (now - lastSweepAt < SWEEP_THROTTLE_MS) return;
  lastSweepAt = now;
  cancelStalePendingOrders().catch((e) => {
    console.error("[order-cleanup] 스윕 실패", { error: e?.message });
  });
  // 결제/주문 불일치 감지 — 자동 수정하지 않고 표시(reconcileNote)+로그만. 스윕과 독립 실행.
  flagInconsistentOrders().catch((e) => {
    console.error("[order-cleanup] 불일치 감지 실패", { error: e?.message });
  });
}

export async function cancelStalePendingOrders(
  olderThanMinutes = STALE_MINUTES
): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);

  const stale = await prisma.order.findMany({
    where: { status: "PENDING", createdAt: { lt: cutoff } },
    include: { items: true, payment: true },
    take: BATCH_SIZE,
    orderBy: { createdAt: "asc" },
  });
  if (stale.length === 0) return 0;

  let cancelled = 0;
  for (const order of stale) {
    // 결제 완료 기록이 있는 PENDING = 불일치. 자동 취소 금지, 수동 확인 대상.
    if (order.payment?.status === "COMPLETED") {
      console.error("[order-cleanup] 결제 COMPLETED 인데 주문 PENDING — 수동 확인 필요", {
        orderNumber: order.orderNumber,
      });
      continue;
    }
    // 노티 금액/통화 불일치 이력이 있는 주문 = 실제 결제 여부 불확실. 자동 취소 금지, 수동 확인 대상.
    if (order.payment?.pgRaw?.startsWith("MISMATCH:")) {
      console.error("[order-cleanup] 노티 금액 불일치 이력 있음 — 수동 확인 필요", {
        orderNumber: order.orderNumber,
      });
      continue;
    }
    try {
      await prisma.$transaction(async (tx) => {
        const won = await tx.order.updateMany({
          where: { id: order.id, status: "PENDING" },
          data: { status: "CANCELLED" },
        });
        if (won.count === 0) return; // 그 사이 노티/취소가 처리함
        await tx.payment.updateMany({
          where: { orderId: order.id, status: "PENDING" },
          data: { status: "CANCELLED", cancelledAt: new Date() },
        });
        await restoreOrderResources(tx, order);
        cancelled += 1;
      });
    } catch (e: any) {
      console.error("[order-cleanup] 주문 정리 실패", {
        orderNumber: order.orderNumber,
        error: e?.message,
      });
    }
  }
  if (cancelled > 0) {
    console.log(`[order-cleanup] 방치 PENDING 주문 ${cancelled}건 취소·복원`);
  }
  return cancelled;
}

/**
 * 결제/주문 상태 불일치 감지 — **자동 수정하지 않고** 관리자 확인용으로 표시(reconcileNote)+로그만 남긴다.
 * (환불 도중 크래시 등으로 돈은 움직였는데 DB 상태가 어긋난 건을 사람이 판단하도록)
 *
 * 감지 대상:
 *  (a) 결제는 종료(CANCELLED/REFUNDED)인데 주문은 아직 종료(CANCELLED/RETURNED)가 아님
 *  (b) 반품요청이 PENDING 인데 결제는 이미 REFUNDED (반품 완료 처리가 중간에 끊긴 케이스)
 *
 * 이미 표시된(reconcileNote 존재) 건은 건너뛰어 로그 스팸/덮어쓰기를 방지한다.
 */
const RECONCILE_BUFFER_MINUTES = 15;

export async function flagInconsistentOrders(): Promise<number> {
  let flagged = 0;
  // 정상 취소/환불이 진행 중인 짧은 창(결제는 종료로 락됐으나 주문 tx 미완)을 불일치로 오탐하지 않도록,
  // 결제 종료 시각(cancelledAt)이 이 기준보다 오래된 건만 표시한다.
  const bufferCutoff = new Date(Date.now() - RECONCILE_BUFFER_MINUTES * 60 * 1000);

  // (a) 결제 종료 ↔ 주문 미종료 불일치
  const mismatched = await prisma.order.findMany({
    where: {
      reconcileNote: null,
      status: { notIn: ["CANCELLED", "RETURNED"] },
      payment: {
        is: { status: { in: ["CANCELLED", "REFUNDED"] }, cancelledAt: { lt: bufferCutoff } },
      },
    },
    include: { payment: true },
    take: BATCH_SIZE,
    orderBy: { createdAt: "asc" },
  });
  for (const order of mismatched) {
    const note = `결제상태 ${order.payment?.status} 이나 주문상태 ${order.status} — 결제/주문 불일치. 실제 환불 여부(refundedAt=${order.payment?.refundedAt ? "있음" : "없음"}) 확인 후 수동 처리 필요.`;
    console.error("[order-cleanup] 불일치(결제종료·주문미종료) 감지 — 수동 확인 필요", {
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      paymentStatus: order.payment?.status,
      refundedAt: order.payment?.refundedAt ?? null,
    });
    await prisma.order.update({ where: { id: order.id }, data: { reconcileNote: note } });
    flagged += 1;
  }

  // (b) 반품요청 PENDING ↔ 결제 REFUNDED (반품 완료 처리 중단)
  const stuckReturns = await prisma.returnRequest.findMany({
    where: {
      status: "PENDING",
      order: {
        reconcileNote: null,
        payment: { is: { status: "REFUNDED", cancelledAt: { lt: bufferCutoff } } },
      },
    },
    include: { order: { include: { payment: true } } },
    take: BATCH_SIZE,
    orderBy: { createdAt: "asc" },
  });
  for (const rr of stuckReturns) {
    const refundedAt = rr.order.payment?.refundedAt ?? null;
    const note = `반품요청 PENDING 이나 결제 REFUNDED — 반품 완료 처리 중단 가능. 환불확정(refundedAt=${refundedAt ? "있음" : "없음"}) 확인 후 재승인/수동 처리 필요.`;
    console.error("[order-cleanup] 불일치(반품 PENDING·결제 REFUNDED) 감지 — 수동 확인 필요", {
      orderNumber: rr.order.orderNumber,
      returnRequestId: rr.id,
      refundedAt,
    });
    await prisma.order.update({ where: { id: rr.orderId }, data: { reconcileNote: note } });
    flagged += 1;
  }

  if (flagged > 0) {
    console.log(`[order-cleanup] 결제/주문 불일치 ${flagged}건 표시(reconcileNote)`);
  }
  return flagged;
}
