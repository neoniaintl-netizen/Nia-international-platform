import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PORTONE_API } from "@/lib/payment";

/**
 * POST /api/payment/verify
 * PortOne 결제 검증 API
 *
 * PG 연동 시: PortOne V2 API로 실제 결제 금액/상태 검증
 * 테스트 모드: 검증 없이 바로 성공 반환
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "인증이 필요합니다." },
      { status: 401 }
    );
  }

  const { paymentId, orderId, expectedAmount } = await req.json();

  // =====================================================
  // PG 연동 시 아래 주석 해제
  // PortOne V2 API로 결제 검증
  // =====================================================
  /*
  try {
    const response = await fetch(
      `${PORTONE_API.baseUrl}/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: {
          Authorization: `PortOne ${PORTONE_API.secret}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "결제 정보를 조회할 수 없습니다." },
        { status: 400 }
      );
    }

    const payment = await response.json();

    // 금액 검증: 요청 금액과 실제 결제 금액이 일치하는지 확인
    if (payment.amount.total !== expectedAmount) {
      return NextResponse.json(
        { error: "결제 금액이 일치하지 않습니다." },
        { status: 400 }
      );
    }

    // 결제 상태 검증
    if (payment.status !== "PAID") {
      return NextResponse.json(
        { error: "결제가 완료되지 않았습니다." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      amount: payment.amount.total,
      method: payment.method?.type,
    });
  } catch (error) {
    console.error("[Payment Verify Error]", error);
    return NextResponse.json(
      { error: "결제 검증 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
  */

  // =====================================================
  // 테스트 모드: PG 연동 전 임시 처리
  // TODO: PG 연동 후 위 코드 주석 해제하고 아래 코드 삭제
  // =====================================================
  console.log(
    `[Payment] 테스트 모드 - paymentId: ${paymentId}, orderId: ${orderId}, amount: ${expectedAmount}`
  );
  // suppress unused var lint for PORTONE_API (used in commented PG code above)
  void PORTONE_API;

  return NextResponse.json({
    success: true,
    paymentId: paymentId || `TEST-${Date.now()}`,
    amount: expectedAmount,
    method: "card",
    testMode: true,
  });
}
