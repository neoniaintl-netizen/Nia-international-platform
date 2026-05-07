import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { IS_PAYMENT_TEST_MODE, verifyPayment } from "@/lib/payment";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const VerifySchema = z
  .object({
    paymentId: z.string().min(1).max(200),
    orderId: z.string().min(1).max(200),
  })
  .strict();

/**
 * POST /api/payment/verify
 *
 * PortOne 결제 검증.
 * - 클라이언트가 보고한 결제를 서버↔서버로 PortOne API에 재조회
 * - 금액은 클라이언트가 보낸 값을 신뢰하지 않고 DB의 Order.finalAmount와 비교
 * - 검증 통과 시 Payment를 transactionId 기준 upsert(멱등성), Order 상태 PAID
 *
 * 테스트 모드(NEXT_PUBLIC_PAYMENT_TEST_MODE=true)에서는 PG 호출을 생략하지만
 * 여전히 본인 주문/금액 검증은 수행함.
 */
export async function POST(req: NextRequest) {
  // 1) 로그인 확인
  const guard = await requireUser();
  if (!guard.ok) return guard.response;
  const userId = guard.session.user!.id!;

  // Rate limit — 사용자당 분당 10회
  const rl = await rateLimit(`payment-verify:${userId}`, {
    limit: 10,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  // 2) 입력 검증
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = VerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "잘못된 요청입니다." },
      { status: 400 }
    );
  }
  const { paymentId, orderId } = parsed.data;

  // 3) DB에서 주문 조회 (본인 주문만)
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { payment: true },
  });

  if (!order) {
    return NextResponse.json(
      { error: "주문을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 이미 PAID 처리된 주문은 즉시 성공 반환 (멱등성)
  if (order.status === "PAID" && order.payment?.status === "COMPLETED") {
    return NextResponse.json({
      success: true,
      paymentId: order.payment.transactionId,
      amount: order.finalAmount,
      alreadyProcessed: true,
    });
  }

  // 4) 결제 정보 결정
  let verifiedAmount: number;
  let verifiedStatus: string;
  let verifiedMethod: string | null;
  let verifiedPaidAt: Date | null = null;

  if (IS_PAYMENT_TEST_MODE) {
    // 테스트 모드: PortOne 호출 없이 자체 승인 (본인 주문 검증은 위에서 완료)
    verifiedAmount = order.finalAmount;
    verifiedStatus = "PAID";
    verifiedMethod = "TEST";
    verifiedPaidAt = new Date();
  } else {
    // 운영 모드: PortOne API로 서버↔서버 재확인
    const result = await verifyPayment(paymentId);
    if (!result.ok) {
      return NextResponse.json(
        { error: "결제 정보를 조회할 수 없습니다." },
        { status: 400 }
      );
    }

    if (result.status !== "PAID") {
      return NextResponse.json(
        { error: "결제가 완료되지 않았습니다." },
        { status: 400 }
      );
    }

    if (result.amount !== order.finalAmount) {
      console.error(
        `[verify] amount mismatch: portone=${result.amount}, db=${order.finalAmount}, orderId=${orderId}`
      );
      return NextResponse.json(
        { error: "결제 금액이 일치하지 않습니다." },
        { status: 400 }
      );
    }

    verifiedAmount = result.amount;
    verifiedStatus = result.status;
    verifiedMethod = result.method;
    verifiedPaidAt = result.paidAt ? new Date(result.paidAt) : new Date();
  }

  // 5) DB 갱신 (트랜잭션, transactionId 기준 upsert로 멱등성)
  try {
    await prisma.$transaction(async (tx) => {
      // Order 상태 PAID
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paidAt: verifiedPaidAt,
        },
      });

      // Payment upsert by transactionId (paymentId === transactionId 일관)
      const existingPayment = await tx.payment.findUnique({
        where: { orderId: order.id },
      });

      if (existingPayment) {
        await tx.payment.update({
          where: { orderId: order.id },
          data: {
            status: "COMPLETED",
            transactionId: paymentId,
            amount: verifiedAmount,
            paidAt: verifiedPaidAt,
            isTest: IS_PAYMENT_TEST_MODE,
          },
        });
      } else {
        await tx.payment.create({
          data: {
            orderId: order.id,
            method: (order.paymentMethod as never) ?? "CARD",
            status: "COMPLETED",
            transactionId: paymentId,
            amount: verifiedAmount,
            paidAt: verifiedPaidAt,
            isTest: IS_PAYMENT_TEST_MODE,
          },
        });
      }
    });
  } catch (err) {
    console.error("[verify] db transaction failed:", err);
    return NextResponse.json(
      { error: "결제 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    paymentId,
    amount: verifiedAmount,
    method: verifiedMethod,
    status: verifiedStatus,
    testMode: IS_PAYMENT_TEST_MODE,
  });
}
