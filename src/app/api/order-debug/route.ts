import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/order-debug?order=ORD-...
 * 본인 주문의 PG 디버그 데이터 — 결제 노티 원본(pgRaw) + 환불 응답(refundRaw) + transactionId.
 * 목적: ICB가 노티로 보내는 실제 거래번호 필드 확인 → 환불 transid 정확화.
 * (본인 소유 주문만 조회 가능)
 */
const safeParse = (s: string | null) => {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "login required" }, { status: 401 });
  }
  const orderNumber = req.nextUrl.searchParams.get("order");
  if (!orderNumber) {
    return NextResponse.json({ error: "order param required (?order=ORD-...)" }, { status: 400 });
  }
  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: session.user.id },
    include: { payment: true },
  });
  if (!order) {
    return NextResponse.json({ error: "order not found (or not yours)" }, { status: 404 });
  }
  const p = order.payment;
  return NextResponse.json({
    orderNumber: order.orderNumber,
    orderStatus: order.status,
    paymentMethod: order.paymentMethod,
    payment: p
      ? {
          status: p.status,
          transactionId: p.transactionId,
          pgCurrency: p.pgCurrency,
          pgAmount: p.pgAmount ? String(p.pgAmount) : null,
          pgRaw: safeParse(p.pgRaw), // ← 결제 노티 원본 (여기서 ICB 실제 거래번호 필드 확인)
          refundRaw: safeParse(p.refundRaw), // ← 환불 응답 + 우리가 보낸 transid
        }
      : null,
  });
}
