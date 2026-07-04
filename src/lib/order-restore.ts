import type { Prisma } from "@/generated/prisma/client";

/**
 * 주문 취소/결제 실패 시 자원 복원 — 재고·품절상태·쿠폰·포인트.
 *
 * 호출 규약(이중 복원 방지):
 * 반드시 "주문 상태 전이를 CAS 로 이긴" 트랜잭션 안에서만 호출할 것.
 *   const won = await tx.order.updateMany({ where: { id, status: "PENDING" }, data: { status: "CANCELLED" } });
 *   if (won.count === 1) await restoreOrderResources(tx, order);
 * 상태 전이가 원자적이므로 취소/노티가 동시에 와도 복원은 정확히 한 번만 실행된다.
 */

export type RestorableOrder = {
  id: string;
  orderNumber: string;
  userId: string;
  couponId: string | null;
  discountAmount: number;
  items: Array<{
    productId: string;
    variantId: string | null;
    quantity: number;
  }>;
};

export async function restoreOrderResources(
  tx: Prisma.TransactionClient,
  order: RestorableOrder,
  options?: { stock?: boolean }
): Promise<void> {
  // 1) 재고 복원 + 품절 해제 (재고가 살아났으면 SOLDOUT → ACTIVE)
  //    options.stock === false 이면 재고 복원을 건너뛴다 — 이미 출고됐을 수 있는 주문(예: 환불 후
  //    상태 경합으로 배송처리된 건)에서 실물 회수 전 재고를 늘리면 오버셀이 되므로.
  const restoreStock = options?.stock !== false;
  if (restoreStock) {
    for (const item of order.items) {
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
  }

  // 2) 쿠폰 복원 — userCoupon 이 실제로 복원된 경우에만 usedCount 감소
  //    (이미 복원된 쿠폰이면 count=0 → usedCount 를 건드리지 않아 드리프트 방지)
  if (order.couponId) {
    const restored = await tx.userCoupon.updateMany({
      where: {
        userId: order.userId,
        couponId: order.couponId,
        usedAt: { not: null },
      },
      data: { usedAt: null },
    });
    if (restored.count > 0) {
      await tx.coupon.updateMany({
        where: { id: order.couponId, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    }
  }

  // 3) 사용 포인트 환원 (사용 기록이 있고, 아직 환원 기록이 없을 때만)
  if (order.discountAmount > 0) {
    const used = await tx.pointHistory.findFirst({
      where: {
        userId: order.userId,
        type: "USE_ORDER",
        description: { contains: order.orderNumber },
      },
    });
    if (used) {
      const alreadyRestored = await tx.pointHistory.findFirst({
        where: {
          userId: order.userId,
          type: "ADMIN_ADJUST",
          amount: Math.abs(used.amount),
          description: { contains: order.orderNumber },
        },
      });
      if (!alreadyRestored) {
        const balance =
          (
            await tx.pointHistory.aggregate({
              where: { userId: order.userId },
              _sum: { amount: true },
            })
          )._sum.amount ?? 0;
        await tx.pointHistory.create({
          data: {
            userId: order.userId,
            amount: Math.abs(used.amount),
            balance: balance + Math.abs(used.amount),
            type: "ADMIN_ADJUST",
            description: `주문 취소/실패 환원 (${order.orderNumber})`,
          },
        });
      }
    }
  }
}
