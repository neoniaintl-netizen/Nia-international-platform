// =====================================================
// PortOne(아임포트) V2 결제 설정 + 서버측 API 헬퍼
// 운영 시 Railway 환경변수에 PORTONE_API_SECRET, PORTONE_WEBHOOK_SECRET 등을 설정
// =====================================================

import { randomBytes } from "crypto";

export const PORTONE_CONFIG = {
  // PortOne 콘솔 > 결제 연동 > 식별코드
  storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID || "imp00000000",
  // PortOne 콘솔 > 결제 연동 > 채널 관리
  channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || "",
};

// PortOne V2 서버 API 설정 — secret은 절대 클라이언트에 노출되지 않음
export const PORTONE_API = {
  secret: process.env.PORTONE_API_SECRET || "",
  baseUrl: "https://api.portone.io",
};

/**
 * 결제 테스트 모드 여부.
 * - production에서는 반드시 false (운영 키 + 실 결제)
 * - dev/staging에서만 true (PortOne 테스트 키)
 */
export const IS_PAYMENT_TEST_MODE =
  process.env.NEXT_PUBLIC_PAYMENT_TEST_MODE === "true";

/**
 * 주문 고유번호(merchant_uid) 생성.
 * 형식: ORDER-YYYYMMDD-XXXXXXXX
 * crypto.randomBytes 기반 — 예측 불가능.
 */
export function generateMerchantUid() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = randomBytes(6).toString("base64url").toUpperCase().slice(0, 8);
  return `ORDER-${date}-${rand}`;
}

/**
 * 결제 수단별 PG사 매핑.
 * PortOne V2에서는 channelKey로 PG사를 구분하지만 payMethod는 여전히 필요.
 */
export const PAYMENT_METHOD_MAP: Record<
  string,
  { pgProvider: string; payMethod: string }
> = {
  CARD: { pgProvider: "tosspayments", payMethod: "CARD" },
  KAKAO_PAY: { pgProvider: "kakaopay", payMethod: "EASY_PAY" },
  NAVER_PAY: { pgProvider: "naverpay", payMethod: "EASY_PAY" },
  TOSS_PAY: { pgProvider: "tosspay", payMethod: "EASY_PAY" },
  BANK_TRANSFER: { pgProvider: "tosspayments", payMethod: "TRANSFER" },
};

// =====================================================
// 서버측 PortOne API 헬퍼
// 모든 PG 호출은 이 모듈을 통하도록 강제 (라우트에서 직접 fetch 금지)
// =====================================================

export type PortOnePaymentStatus =
  | "READY"
  | "PENDING"
  | "VIRTUAL_ACCOUNT_ISSUED"
  | "PAID"
  | "FAILED"
  | "PARTIAL_CANCELLED"
  | "CANCELLED";

export interface PortOnePaymentResult {
  ok: true;
  paymentId: string;
  status: PortOnePaymentStatus;
  amount: number; // 총 결제 금액 (KRW)
  currency: string;
  method: string | null;
  paidAt: string | null;
  raw: unknown;
}

export interface PortOneError {
  ok: false;
  error: string;
  status?: number;
}

/**
 * PortOne V2 결제 정보 조회.
 * 클라이언트가 보고한 결제 결과를 서버↔서버로 재확인하는 용도.
 *
 * @param paymentId PortOne의 결제 ID (식별 코드)
 * @returns 결제 정보 또는 에러
 */
export async function verifyPayment(
  paymentId: string
): Promise<PortOnePaymentResult | PortOneError> {
  if (!PORTONE_API.secret) {
    return { ok: false, error: "PORTONE_API_SECRET not configured" };
  }

  try {
    const res = await fetch(
      `${PORTONE_API.baseUrl}/payments/${encodeURIComponent(paymentId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `PortOne ${PORTONE_API.secret}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return {
        ok: false,
        error: `PortOne API ${res.status}`,
        status: res.status,
      };
    }

    const data = await res.json();

    // PortOne V2 응답 구조: { id, status, amount: { total, ... }, method, paidAt, ... }
    const total: number =
      typeof data?.amount?.total === "number"
        ? data.amount.total
        : typeof data?.amount === "number"
          ? data.amount
          : 0;

    return {
      ok: true,
      paymentId: String(data?.id ?? paymentId),
      status: (data?.status ?? "PENDING") as PortOnePaymentStatus,
      amount: total,
      currency: String(data?.currency ?? "KRW"),
      method:
        typeof data?.method?.type === "string"
          ? data.method.type
          : typeof data?.method === "string"
            ? data.method
            : null,
      paidAt:
        typeof data?.paidAt === "string"
          ? data.paidAt
          : data?.paidAt instanceof Date
            ? (data.paidAt as Date).toISOString()
            : null,
      raw: data,
    };
  } catch (err) {
    console.error("[verifyPayment] fetch error:", err);
    return { ok: false, error: "PortOne API unreachable" };
  }
}

/**
 * PortOne V2 결제 취소(환불).
 *
 * @param paymentId PortOne의 결제 ID
 * @param reason 환불 사유 (필수)
 * @param amount 부분취소 금액 (생략 시 전액 취소)
 */
export async function cancelPayment(
  paymentId: string,
  reason: string,
  amount?: number
): Promise<{ ok: true; raw: unknown } | PortOneError> {
  if (!PORTONE_API.secret) {
    return { ok: false, error: "PORTONE_API_SECRET not configured" };
  }

  try {
    const body: Record<string, unknown> = { reason };
    if (typeof amount === "number") {
      body.amount = amount;
    }

    const res = await fetch(
      `${PORTONE_API.baseUrl}/payments/${encodeURIComponent(paymentId)}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `PortOne ${PORTONE_API.secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        `[cancelPayment] PortOne ${res.status}:`,
        text.slice(0, 500)
      );
      return {
        ok: false,
        error: `PortOne cancel API ${res.status}`,
        status: res.status,
      };
    }

    const data = await res.json();
    return { ok: true, raw: data };
  } catch (err) {
    console.error("[cancelPayment] fetch error:", err);
    return { ok: false, error: "PortOne API unreachable" };
  }
}

/**
 * PortOne webhook HMAC 서명 검증.
 *
 * @param rawBody webhook 원본 본문 (Buffer/string)
 * @param signature `x-portone-signature` 헤더 값
 * @param secret `PORTONE_WEBHOOK_SECRET` env
 * @returns 서명 일치 여부
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) return false;

  // 동기 import — Node 런타임 보장 (route.ts에서 export const runtime = "nodejs")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("crypto") as typeof import("crypto");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  // 타이밍 공격 방지를 위한 상수시간 비교
  const sigBuf = Buffer.from(signature, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}
