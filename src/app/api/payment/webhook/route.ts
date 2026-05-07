import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  IS_PAYMENT_TEST_MODE,
  verifyPayment,
  verifyWebhookSignature,
} from "@/lib/payment";

export const runtime = "nodejs";

/**
 * POST /api/payment/webhook
 *
 * PortOne webhook 수신.
 *
 * 1) `x-portone-signature` 헤더의 HMAC-SHA256 서명을 `PORTONE_WEBHOOK_SECRET`로 검증
 * 2) body에서 paymentId 추출
 * 3) **PortOne API로 서버↔서버 재조회** (webhook payload 신뢰 X)
 * 4) Payment를 transactionId 기준으로 upsert — 두 번 와도 한 번만 처리되는 멱등성
 *
 * Railway는 `PORTONE_WEBHOOK_SECRET` 환경변수에 PortOne 콘솔에서 발급한
 * webhook secret을 설정해야 함. 미설정 시 모든 webhook은 403으로 거절.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.PORTONE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] PORTONE_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 503 }
    );
  }

  // 1) raw body 확보 (HMAC 검증용)
  const rawBody = await req.text();

  // 2) 서명 검증
  const signature = req.headers.get("x-portone-signature");
  const valid = verifyWebhookSignature(rawBody, signature, secret);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  // 3) body 파싱
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = (payload ?? {}) as {
    type?: string;
    paymentId?: string;
    data?: { paymentId?: string };
  };
  const paymentId = data?.paymentId ?? data?.data?.paymentId;

  if (!paymentId || typeof paymentId !== "string") {
    return NextResponse.json(
      { error: "Missing paymentId" },
      { status: 400 }
    );
  }

  // 4) 멱등성: 이미 COMPLETED 면 그대로 200
  const existing = await prisma.payment.findFirst({
    where: { transactionId: paymentId },
    include: { order: true },
  });
  if (existing && existing.status === "COMPLETED") {
    return NextResponse.json({ ok: true, already: true });
  }

  // 5) PortOne 재조회 (webhook payload 신뢰 X)
  const result = await verifyPayment(paymentId);
  if (!result.ok) {
    console.error(
      `[webhook] verifyPayment failed: ${result.error}, paymentId=${paymentId}`
    );
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 502 }
    );
  }

  // 6) PAID 가 아니면 상태만 업데이트 (가상계좌 발급 등)
  if (result.status !== "PAID") {
    if (existing) {
      const newStatus =
        result.status === "FAILED"
          ? "FAILED"
          : result.status === "CANCELLED"
            ? "CANCELLED"
            : "PENDING";
      await prisma.payment.update({
        where: { id: existing.id },
        data: { status: newStatus },
      });
    }
    return NextResponse.json({ ok: true, status: result.status });
  }

  // 7) PAID — Order/Payment 갱신
  if (!existing) {
    console.error(
      `[webhook] PAID for unknown paymentId=${paymentId}; cannot map to order`
    );
    return NextResponse.json(
      { error: "Order not found for paymentId" },
      { status: 404 }
    );
  }

  const order = existing.order;
  if (result.amount !== order.finalAmount) {
    console.error(
      `[webhook] amount mismatch: portone=${result.amount}, db=${order.finalAmount}, orderId=${order.id}`
    );
    return NextResponse.json(
      { error: "Amount mismatch" },
      { status: 400 }
    );
  }

  const paidAt = result.paidAt ? new Date(result.paidAt) : new Date();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: existing.id },
        data: {
          status: "COMPLETED",
          amount: result.amount,
          paidAt,
          isTest: IS_PAYMENT_TEST_MODE,
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID", paidAt },
      });
    });
  } catch (err) {
    console.error("[webhook] db transaction failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
