/**
 * Funpay (ICB Online Payment) 연동 라이브러리 — 서버 전용.
 *
 * 통신 규격:
 *  - HTTP POST / 요청 = FormData / 응답 = JSON / UTF-8
 *  - 4단계: 결제 승인(payment) → 노티(statusurl) → 조회(query) → 취소(refund)
 *  - fgkey(위·변조 방지 서명): 모든 파라미터 문자열을 문자 단위 오름차순 정렬 →
 *    `secretkey + "?" + TEXT_A` → SHA-256 → uppercase
 *
 * 가맹점 정보(mid/secretkey)와 base URL 은 .env 로 주입:
 *  - FUNPAY_MID
 *  - FUNPAY_SECRET_KEY
 *  - FUNPAY_API_BASE   (테스트: https://onlinetest.funpay.co.kr / 운영: 영업 전달)
 *  - FUNPAY_SERVICE_TYPE (기본 S000)
 *  - NEXT_PUBLIC_BASE_URL (returnurl/statusurl 절대경로 조립용)
 */
import { createHash } from "crypto";

// ─────────────────────────────────────────────
//  설정 (env)
// ─────────────────────────────────────────────

export const FUNPAY_API_BASE =
  process.env.FUNPAY_API_BASE ?? "https://onlinetest.funpay.co.kr";
export const FUNPAY_MID = process.env.FUNPAY_MID ?? "";
const FUNPAY_SECRET_KEY = process.env.FUNPAY_SECRET_KEY ?? "";
export const FUNPAY_SERVICE_TYPE = process.env.FUNPAY_SERVICE_TYPE ?? "S000";

/** 결제 통화 (알리/위챗 결제 금액 기준 — 계약 통화). 기본 KRW. */
export const FUNPAY_CURRENCY = process.env.FUNPAY_CURRENCY ?? "KRW";

/**
 * 결제수단(PaymentMethod) → Funpay servicetype 코드.
 * 영업이 결제수단별 코드 전달 → env 로 주입. 미설정 시 공통 FUNPAY_SERVICE_TYPE.
 */
export function funpayServiceType(paymentMethod: string): string {
  switch (paymentMethod) {
    case "ALIPAY":
      return process.env.FUNPAY_SERVICE_TYPE_ALIPAY ?? FUNPAY_SERVICE_TYPE;
    case "WECHAT_PAY":
      return process.env.FUNPAY_SERVICE_TYPE_WECHAT ?? FUNPAY_SERVICE_TYPE;
    default:
      return FUNPAY_SERVICE_TYPE;
  }
}

/** 결제수단 → reqtype. 알리/위챗은 모바일웹(M) 기본 (PC/모바일 범용). */
export function funpayReqType(_paymentMethod: string): FunpayReqType {
  return "M";
}

/**
 * KRW 정수 금액 → Funpay reqamt 문자열.
 * KRW 는 소수 없음(정수 문자열), 그 외 통화는 소수 2자리.
 * 통화 환산이 필요하면 호출 전에 queryExchangeRate 로 변환 후 전달.
 */
export function formatFunpayAmount(amount: number, currency: string = FUNPAY_CURRENCY): string {
  if (currency === "KRW" || currency === "JPY") return String(Math.round(amount));
  return amount.toFixed(2);
}

export const FUNPAY_ENDPOINTS = {
  payment: `${FUNPAY_API_BASE}/payment/payment.icb`,
  query: `${FUNPAY_API_BASE}/payment/query.icb`,
  refund: `${FUNPAY_API_BASE}/payment/refund.icb`,
  compare: `${FUNPAY_API_BASE}/compare/compare.icb`,
  settle: `${FUNPAY_API_BASE}/compare/settle.icb`,
  exchangeRate: `${FUNPAY_API_BASE}/exchangerate/query.icb`,
} as const;

export function isFunpayConfigured(): boolean {
  return Boolean(FUNPAY_MID && FUNPAY_SECRET_KEY);
}

// ─────────────────────────────────────────────
//  fgkey 생성 / 검증
// ─────────────────────────────────────────────

/**
 * 파라미터 객체 → `key=value&key=value...` 문자열 (fgkey 제외).
 * 순서는 무관 (다음 단계에서 문자 단위 정렬하므로). null/undefined 는 빈 문자열로.
 */
function toParamString(params: Record<string, string | number | undefined | null>): string {
  return Object.entries(params)
    .filter(([k]) => k !== "fgkey")
    .map(([k, v]) => `${k}=${v ?? ""}`)
    .join("&");
}

/**
 * fgkey 생성.
 * 가이드 예시 분석: 전체 파라미터 문자열의 "모든 문자"를 오름차순 정렬(TEXT_A) →
 * `secretkey + "?" + TEXT_A`(TEXT_B) → SHA-256 hex(TEXT_C) → uppercase(fgkey).
 *
 * @param paramStringOrObj 원본 파라미터 (문자열 또는 객체)
 */
export function buildFgkey(
  paramStringOrObj: string | Record<string, string | number | undefined | null>,
  secretKey: string = FUNPAY_SECRET_KEY,
): string {
  const paramString =
    typeof paramStringOrObj === "string"
      ? paramStringOrObj
      : toParamString(paramStringOrObj);

  // TEXT_A: 전체 문자열을 코드포인트 기준 오름차순 정렬 (공백 포함)
  const textA = [...paramString].sort().join("");
  // TEXT_B: secretkey ? TEXT_A
  const textB = `${secretKey}?${textA}`;
  // TEXT_C: SHA-256 (UTF-8) hex → uppercase
  return createHash("sha256").update(textB, "utf8").digest("hex").toUpperCase();
}

/**
 * 노티/응답으로 받은 파라미터의 fgkey 검증.
 * 받은 값에서 fgkey 를 분리하고 나머지로 재계산해 일치 확인.
 */
export function verifyFgkey(
  params: Record<string, string | number | undefined | null>,
  secretKey: string = FUNPAY_SECRET_KEY,
): boolean {
  const received = String(params.fgkey ?? "").toUpperCase();
  if (!received) return false;
  const expected = buildFgkey(params, secretKey);
  // 타이밍 안전 비교
  if (received.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < received.length; i++) {
    diff |= received.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

// ─────────────────────────────────────────────
//  결제 승인 요청 파라미터 빌더
// ─────────────────────────────────────────────

export type FunpayReqType = "P" | "M" | "A" | "J" | "N"; // P=QR, M=모바일웹, A=APP, J=JSAPI, N=MiniProgram
export type FunpayResType = "JSON" | "REDIRECT";

export interface BuildPaymentParamsInput {
  /** 가맹점 주문번호 (refno) — Funpay 전역 유니크 권장 */
  refno: string;
  /** 결제 금액 (문자열, 소수 2자리 권장 e.g. "1.00") */
  reqamt: string;
  /** 결제 통화 (USD/CNY/KRW 등 — 계약 통화) */
  reqcur: string;
  /** 결제수단 원천사 servicetype — 영업이 결제수단별 코드 전달 */
  servicetype?: string;
  /** P=QR / M=모바일웹 (알리·위챗) */
  reqtype: FunpayReqType;
  /** JSON(커스텀) or REDIRECT(기본 중계) */
  restype?: FunpayResType;
  /** 상품명 */
  product: string;
  /** 구매자명 */
  buyername?: string;
  tel?: string;
  email?: string;
  /** 브라우저 복귀 URL (절대경로) */
  returnurl: string;
  /** 서버 노티 수신 URL (절대경로) */
  statusurl: string;
  /** 위챗/알리 예비필드 (위챗 JSAPI OpenID, 알리 APP OS 등) */
  param1?: string;
  param2?: string;
  param3?: string;
  /** 알리페이+ 지갑 (CONNECT_WALLET 등) */
  walletId?: string;
  /** 결제 만료 시간 (선택) */
  expiretime?: string;
  /** 원천사 추가 정보 (JSON string) */
  trade_information?: string;
}

/**
 * 결제 승인 요청 파라미터 (fgkey 포함) 생성.
 * 반환값을 form 으로 만들어 FUNPAY_ENDPOINTS.payment 로 POST submit (브라우저) 하거나
 * 서버에서 fetch POST (restype=JSON) 한다.
 */
export function buildPaymentParams(input: BuildPaymentParamsInput): Record<string, string> {
  const params: Record<string, string> = {
    mid: FUNPAY_MID,
    ver: "V2",
    servicetype: input.servicetype ?? FUNPAY_SERVICE_TYPE,
    refno: input.refno,
    reqamt: input.reqamt,
    reqcur: input.reqcur,
    reqtype: input.reqtype,
    restype: input.restype === "JSON" ? "JSON" : "", // REDIRECT 면 빈값(기본 중계)
    product: input.product,
    buyername: input.buyername ?? "",
    tel: input.tel ?? "",
    email: input.email ?? "",
    returnurl: input.returnurl,
    statusurl: input.statusurl,
    param1: input.param1 ?? "",
    param2: input.param2 ?? "",
    param3: input.param3 ?? "",
    walletId: input.walletId ?? "",
    expiretime: input.expiretime ?? "",
    trade_information: input.trade_information ?? "",
    paypal_additional_data: "",
    insmonth: "",
    mname: "",
    refer_url: "",
  };
  params.fgkey = buildFgkey(params);
  return params;
}

// ─────────────────────────────────────────────
//  결제 조회 / 취소 (서버 → Funpay POST)
// ─────────────────────────────────────────────

async function postForm(url: string, params: Record<string, string>): Promise<any> {
  const body = new URLSearchParams(params).toString();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
    body,
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text, _httpStatus: res.status };
  }
}

/** 결제 결과 조회 (단건) */
export async function queryPayment(refno: string): Promise<any> {
  const params: Record<string, string> = {
    mid: FUNPAY_MID,
    ver: "V2",
    servicetype: FUNPAY_SERVICE_TYPE,
    refno,
  };
  params.fgkey = buildFgkey(params);
  return postForm(FUNPAY_ENDPOINTS.query, params);
}

/** 결제 취소 (전체/부분) */
export async function cancelPayment(input: {
  refno: string;
  /** Funpay 거래번호 (조회/노티의 transid) */
  transid?: string;
  /** 취소 금액 (부분취소 시. 전체취소면 생략) */
  cancelamt?: string;
  reqcur?: string;
}): Promise<any> {
  const params: Record<string, string> = {
    mid: FUNPAY_MID,
    ver: "V2",
    servicetype: FUNPAY_SERVICE_TYPE,
    refno: input.refno,
    transid: input.transid ?? "",
    cancelamt: input.cancelamt ?? "",
    reqcur: input.reqcur ?? "",
  };
  params.fgkey = buildFgkey(params);
  return postForm(FUNPAY_ENDPOINTS.refund, params);
}

/** 원천사 적용 환율 조회 */
export async function queryExchangeRate(input: { reqcur: string; servicetype?: string }): Promise<any> {
  const params: Record<string, string> = {
    mid: FUNPAY_MID,
    ver: "V2",
    servicetype: input.servicetype ?? FUNPAY_SERVICE_TYPE,
    reqcur: input.reqcur,
  };
  params.fgkey = buildFgkey(params);
  return postForm(FUNPAY_ENDPOINTS.exchangeRate, params);
}
