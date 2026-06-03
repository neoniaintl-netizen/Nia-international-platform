import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyFgkey,
  FUNPAY_SUCCESS_CODE,
  FUNPAY_PROCESSING_CODE,
} from "@/lib/payment/funpay";

/**
 * POST /api/payment/funpay/notify  (statusurl)
 *
 * Funpay(ICB) 결제 최종 확정 노티 수신.
 * - 요청: FormData (Funpay → 가맹점, 비동기 서버 호출)
 * - 응답: 빈 화면에 평문 "SUCCESS" / "FAIL" (HTML/JSON 으로 감싸면 실패 처리됨)
 * - SUCCESS 가 확인 안 되면 Funpay 가 1·3·5·10·15·20·30·40·55분 간격 재시도
 *
 * 처리:
 *  1) fgkey 검증 (위·변조 차단)
 *  2) refno(=orderNumber) 로 주문 조회
 *  3) 멱등: 이미 PAID 면 SUCCESS 즉시 응답 (중복 노티)
 *  4) rescode 성공 → 주문 PAID + 결제 COMPLETED + 적립 + 장바구니 비움
 *     rescode 실패 → 주문 CANCELLED + 재고/쿠폰/포인트 복원
 *  5) 노티 수신·처리 성공이면 항상 "SUCCESS" (결제 실패 여부는 주문 상태로 표현)
 */

function plain(text: string) {
  return new Response(text, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(req: NextRequest) {
  let params: Record<string, string> = {};
  try {
    const form = await req.formData();
    for (const [k, v] of form.entries()) params[k] = String(v);
  } catch {
    return plain("FAIL");
  }

  // 1) fgkey 검증
  if (!verifyFgkey(params)) {
    console.error("[Funpay notify] fgkey 검증 실패", { refno: params.refno });
    return plain("FAIL");
  }

  const refno = params.refno;
  const rescode = params.rescode ?? params.resultcode ?? "";
  const transid = params.transid ?? params.tradeno ?? "";
  if (!refno) return plain("FAIL");

  const order = await prisma.order.findUnique({
    where: { orderNumber: refno },
    include: { payment: true, items: true },
  });
  if (!order) {
    console.error("[Funpay notify] 주문 없음", { refno });
    return plain("FAIL");
  }

  // 3) 멱등 — 이미 확정된 주문
  if (order.status !== "PENDING") {
    return plain("SUCCESS");
  }

  // 8000 = 결제 진행 중 — 아직 확정 아님. 정상 수신했으므로 SUCCESS 응답 + PENDING 유지.
  if (rescode === FUNPAY_PROCESSING_CODE) {
    return plain("SUCCESS");
  }

  const isSuccess = rescode === FUNPAY_SUCCESS_CODE;

  try {
    if (isSuccess) {
      // ── 결제 성공 확정 ──
      const earnPoints = Math.floor(order.finalAmount * 0.01);
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "PAID", paidAt: new Date() },
        });
        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: {
              status: "COMPLETED",
              transactionId: transid || order.payment.transactionId,
              paidAt: new Date(),
            },
          });
        }
        // 구매 적립 (1%)
        if (earnPoints > 0) {
          const bal =
            (
              await tx.pointHistory.aggregate({
                where: { userId: order.userId },
                _sum: { amount: true },
              })
            )._sum.amount ?? 0;
          await tx.pointHistory.create({
            data: {
              userId: order.userId,
              amount: earnPoints,
              balance: bal + earnPoints,
              type: "EARN_PURCHASE",
              description: `구매 적립 (${order.orderNumber})`,
            },
          });
        }
      });
      // 장바구니 비움 (결제 성공 후)
      await prisma.cartItem.deleteMany({ where: { userId: order.userId } });
      console.log("[Funpay notify] 결제 확정", { refno, transid });
    } else {
      // ── 결제 실패 → 주문 취소 + 복원 ──
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        });
        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: { status: "FAILED" },
          });
        }
        // 재고 복원
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
        // 쿠폰 복원
        if (order.couponId) {
          await tx.userCoupon.updateMany({
            where: { userId: order.userId, couponId: order.couponId, usedAt: { not: null } },
            data: { usedAt: null },
          });
          await tx.coupon.update({
            where: { id: order.couponId },
            data: { usedCount: { decrement: 1 } },
          });
        }
        // 사용 포인트 복원
        if (order.discountAmount > 0) {
          const used = await tx.pointHistory.findFirst({
            where: { userId: order.userId, type: "USE_ORDER", description: { contains: order.orderNumber } },
          });
          if (used) {
            const bal =
              (
                await tx.pointHistory.aggregate({
                  where: { userId: order.userId },
                  _sum: { amount: true },
                })
              )._sum.amount ?? 0;
            await tx.pointHistory.create({
              data: {
                userId: order.userId,
                amount: -used.amount, // USE_ORDER 는 음수였으므로 양수로 환원
                balance: bal - used.amount,
                type: "ADMIN_ADJUST",
                description: `결제 실패 환원 (${order.orderNumber})`,
              },
            });
          }
        }
      });
      console.warn("[Funpay notify] 결제 실패 → 주문 취소", { refno, rescode, resmsg: params.resmsg });
    }
  } catch (e: any) {
    // 처리 중 오류 → SUCCESS 안 줌 → Funpay 재시도 유도
    console.error("[Funpay notify] 처리 오류", { refno, error: e?.message });
    return plain("FAIL");
  }

  return plain("SUCCESS");
}
