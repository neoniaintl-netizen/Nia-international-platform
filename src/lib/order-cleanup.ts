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
