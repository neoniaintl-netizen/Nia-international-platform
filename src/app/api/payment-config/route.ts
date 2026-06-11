import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { isFunpayConfigured, FUNPAY_API_BASE, FUNPAY_MID, FUNPAY_WECHAT_ENABLED } from "@/lib/payment/funpay";

/**
 * GET /api/payment-config
 * 배포된(라이브) 앱의 Funpay/ICB 설정이 운영값으로 반영됐는지 확인용.
 * - apiBase: 게이트웨이 (운영이면 online.funpay.co.kr)
 * - configured: mid+secret 둘 다 세팅됐는지
 * - secretHash8: 시크릿 SHA-256 앞 8자리(값 자체는 노출 안 함) → 올바른 키인지 대조용
 * 로그인 사용자만 조회 가능.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "login required" }, { status: 401 });
  }
  const secret = process.env.FUNPAY_SECRET_KEY ?? "";
  return NextResponse.json({
    apiBase: FUNPAY_API_BASE,
    isProduction: FUNPAY_API_BASE.includes("online.funpay") && !FUNPAY_API_BASE.includes("onlinetest"),
    configured: isFunpayConfigured(),
    wechatEnabled: FUNPAY_WECHAT_ENABLED, // 위챗페이 노출/허용 플래그
    notifyBase: process.env.NEXT_PUBLIC_BASE_URL ?? null, // 노티(statusurl)/복귀(returnurl) 도메인
    midTail: FUNPAY_MID ? FUNPAY_MID.slice(-4) : null,
    secretSet: Boolean(secret),
    secretLen: secret.length,
    secretHash8: secret ? crypto.createHash("sha256").update(secret).digest("hex").slice(0, 8) : null,
  });
}
