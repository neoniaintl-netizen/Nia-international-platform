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

/** 결제 통화 (알리/위챗 결제 금액 기준 — 계약 통화). 기본 KRW.
 *  ※ 발급 MID(P12000000325)는 실측 결과 CNY 만 활성화(KRW·USD 거부) → CNY 사용. */
export const FUNPAY_CURRENCY = process.env.FUNPAY_CURRENCY ?? "KRW";

/** 1 CNY 당 원화(KRW) 환율 (예: 190 → 1위안=190원). FUNPAY_CURRENCY=CNY 일 때 환산에 사용.
 *  환율 API(exchangerate.icb)가 이 MID 에서 미설정(9328)이라 설정값으로 환산한다. */
export const FUNPAY_KRW_PER_CNY = Number(process.env.FUNPAY_KRW_CNY_RATE ?? "190");

/** Funpay 응답코드 — 정상 승인. (8000=결제진행중) */
export const FUNPAY_SUCCESS_CODE = process.env.FUNPAY_SUCCESS_CODE ?? "0000";
export const FUNPAY_PROCESSING_CODE = "8000";

/**
 * servicetype 코드 (명세 기준 기본값):
 *  S000 알리페이 / S006 알리페이+ / S001 위챗페이 / S005 페이팔 / S003 유머니
 * 발급/계약 코드가 다르면 env 로 override.
 */
export function funpayServiceType(paymentMethod: string): string {
  switch (paymentMethod) {
    case "ALIPAY":
      return process.env.FUNPAY_SERVICE_TYPE_ALIPAY ?? "S000";
    case "ALIPAY_PLUS":
      return process.env.FUNPAY_SERVICE_TYPE_ALIPAY_PLUS ?? "S006";
    case "WECHAT_PAY":
      return process.env.FUNPAY_SERVICE_TYPE_WECHAT ?? "S001";
    default:
      return FUNPAY_SERVICE_TYPE;
  }
}

/** 결제수단 → reqtype. P:PC / M:Mobile / A:APP / J:JSAPI / N:Mini. 웹은 모바일웹(M) 기본. */
export function funpayReqType(_paymentMethod: string): FunpayReqType {
  return "M";
}

/**
 * 금액 → Funpay reqamt 문자열 (통화별 단위 규칙).
 *  - KRW: 100원 이상 정수
 *  - USD: 0.01 단위, 소수 2자리
 *  - CNY: 0.1 단위, 소수 2자리
 * @throws 금액 규칙 위반 시 Error
 */
export function formatFunpayAmount(amount: number, currency: string = FUNPAY_CURRENCY): string {
  if (currency === "KRW") {
    const v = Math.round(amount);
    if (v < 100) throw new Error("KRW 결제는 100원 이상이어야 합니다.");
    return String(v);
  }
  if (currency === "USD") {
    if (amount < 0.01) throw new Error("USD 결제는 0.01 이상이어야 합니다.");
    return amount.toFixed(2);
  }
  if (currency === "CNY") {
    if (amount < 0.1) throw new Error("CNY 결제는 0.1 이상이어야 합니다.");
    return amount.toFixed(2);
  }
  return amount.toFixed(2);
}

/**
 * 원화(KRW) 정수 금액 → Funpay 결제 통화/금액(reqcur/reqamt)으로 변환.
 *
 * 상품가는 원화로 저장/표시하되, Funpay 로 보낼 때만 계약 통화로 환산한다.
 *  - FUNPAY_CURRENCY=CNY → reqamt = KRW / FUNPAY_KRW_PER_CNY   (소수 2자리)
 *  - FUNPAY_CURRENCY=KRW → reqamt = KRW 정수 (가맹점이 KRW 활성화된 경우)
 *  - FUNPAY_CURRENCY=USD → reqamt = KRW / FUNPAY_KRW_USD_RATE
 *
 * ⚠️ 환불(refund)의 voidamt 는 결제 시점과 동일 환율로 재계산해야 금액이 일치한다.
 *    Payment 스키마에 CNY 금액 저장 필드가 없으므로, finalAmount(원화) × 동일 환율로
 *    재계산해 일치시킨다. 따라서 결제~환불 사이에 FUNPAY_KRW_CNY_RATE 를 바꾸지 말 것.
 *
 * @throws 환율 미설정/금액 규칙 위반 시 Error
 */
export function toFunpayCharge(krwAmount: number): { reqcur: string; reqamt: string } {
  const cur = FUNPAY_CURRENCY;
  if (cur === "KRW") {
    return { reqcur: "KRW", reqamt: formatFunpayAmount(krwAmount, "KRW") };
  }
  if (cur === "CNY") {
    if (!Number.isFinite(FUNPAY_KRW_PER_CNY) || FUNPAY_KRW_PER_CNY <= 0) {
      throw new Error("환율(FUNPAY_KRW_CNY_RATE)이 올바르게 설정되지 않았습니다.");
    }
    return { reqcur: "CNY", reqamt: formatFunpayAmount(krwAmount / FUNPAY_KRW_PER_CNY, "CNY") };
  }
  if (cur === "USD") {
    const rate = Number(process.env.FUNPAY_KRW_USD_RATE ?? "0");
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error("환율(FUNPAY_KRW_USD_RATE)이 올바르게 설정되지 않았습니다.");
    }
    return { reqcur: "USD", reqamt: formatFunpayAmount(krwAmount / rate, "USD") };
  }
  return { reqcur: cur, reqamt: formatFunpayAmount(krwAmount, cur) };
}

/**
 * trade_information 생성 (원천사별 결제 추가정보, JSON String 한 줄).
 *  - 알리페이(S000/S006): { business_type:"4", goods_info:"상품명^수량|...", total_quantity }
 *  - 위챗페이(S001): { goods_detail:[{ goods_name, quantity }] }
 */
export function buildTradeInformation(
  paymentMethod: string,
  items: { name: string; quantity: number }[],
): string {
  const svc = funpayServiceType(paymentMethod);
  // 위챗페이
  if (svc === "S001") {
    return JSON.stringify({
      goods_detail: items.map((i) => ({
        goods_name: sanitizeGoodsName(i.name),
        quantity: i.quantity,
      })),
    });
  }
  // 알리페이 / 알리페이+ (기본)
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const goodsInfo = items
    .map((i) => `${sanitizeGoodsName(i.name)}^${i.quantity}`)
    .join("|");
  return JSON.stringify({
    business_type: "4",
    goods_info: goodsInfo,
    total_quantity: totalQty,
  });
}

/** goods_info 는 `^` 와 `|` 를 구분자로 쓰므로 상품명에서 제거. 이모지/특수문자 정리. */
function sanitizeGoodsName(name: string): string {
  return name.replace(/[\^|]/g, " ").trim().slice(0, 100) || "product";
}

/** Funpay 응답코드 → 사용자 메시지 매핑. */
export function funpayErrorMessage(rescode: string): string {
  const map: Record<string, string> = {
    "9300": "결제 정보가 올바르지 않습니다.",
    "9301": "결제 서명 검증에 실패했습니다.",
    "9317": "이미 처리 중인 결제 요청입니다.",
    "9402": "이미 결제가 완료된 주문입니다.",
    "9110": "결제 시간이 만료되었습니다. 다시 시도해주세요.",
    "9999": "결제 시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  };
  return map[rescode] ?? `결제 처리 중 오류가 발생했습니다. (${rescode})`;
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

export type FunpayReqType = "P" | "M" | "A" | "J" | "N"; // P=PC / M=Mobile / A=APP / J=JSAPI / N=Mini
export type FunpayResType = "PAGE" | "JSON"; // PAGE=원천사 결제페이지 리다이렉트 / JSON=커스텀(QR/URL 직접)

export interface BuildPaymentParamsInput {
  /** 가맹점 주문번호 (refno) — 매 요청 유니크 */
  refno: string;
  /** 결제 금액 (formatFunpayAmount 로 통화 단위에 맞춰 생성) */
  reqamt: string;
  /** 결제 통화 (KRW/USD/CNY) */
  reqcur: string;
  /** 원천사 servicetype (S000 알리/S001 위챗 …) */
  servicetype: string;
  /** P=PC / M=Mobile (알리·위챗 웹) */
  reqtype: FunpayReqType;
  /** PAGE(기본, 원천사 페이지 이동) / JSON(커스텀) */
  restype?: FunpayResType;
  /** 상품명 (필수) */
  product: string;
  /** 구매자명 (필수) */
  buyername: string;
  /** 원천사 추가정보 JSON String (필수) — buildTradeInformation() */
  trade_information: string;
  /** 결제 시작(referer) URL (필수) */
  refer_url: string;
  /** 브라우저 복귀 URL (필수) */
  returnurl: string;
  /** 서버 노티 수신 URL (필수) */
  statusurl: string;
  tel?: string;
  email?: string;
  mname?: string;
  vat?: string;
  param1?: string;
  param2?: string;
  param3?: string;
  /** 알리페이+ 지갑 (CONNECT_WALLET 등) */
  walletId?: string;
  insmonth?: string;
  expiretime?: string;
  paypal_additional_data?: string;
}

/**
 * 결제 승인 요청 파라미터 (fgkey 포함) 생성.
 * 브라우저가 이 값으로 FUNPAY_ENDPOINTS.payment 에 POST submit.
 * 다국어 값(buyername/product)은 form POST 시 브라우저가 UTF-8 urlencode →
 * fgkey 는 원문(인코딩 전)으로 계산하므로 양쪽 일치 (명세 fgkey 예시도 원문 기준).
 */
export function buildPaymentParams(input: BuildPaymentParamsInput): Record<string, string> {
  const params: Record<string, string> = {
    ver: "V2",
    mid: FUNPAY_MID,
    servicetype: input.servicetype,
    refno: input.refno,
    reqcur: input.reqcur,
    reqamt: input.reqamt,
    buyername: input.buyername,
    product: input.product,
    trade_information: input.trade_information,
    refer_url: input.refer_url,
    returnurl: input.returnurl,
    statusurl: input.statusurl,
    reqtype: input.reqtype,
    restype: input.restype ?? "PAGE",
    mname: input.mname ?? "",
    vat: input.vat ?? "",
    tel: input.tel ?? "",
    email: input.email ?? "",
    param1: input.param1 ?? "",
    param2: input.param2 ?? "",
    param3: input.param3 ?? "",
    walletId: input.walletId ?? "",
    insmonth: input.insmonth ?? "",
    expiretime: input.expiretime ?? "",
    paypal_additional_data: input.paypal_additional_data ?? "",
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

/** 결제 결과 조회 (단건) — /payment/query.icb */
export async function queryPayment(input: {
  refno: string;
  servicetype: string;
  transid?: string;
}): Promise<any> {
  const params: Record<string, string> = {
    ver: "V2",
    mid: FUNPAY_MID,
    servicetype: input.servicetype,
    refno: input.refno,
    transid: input.transid ?? "",
  };
  params.fgkey = buildFgkey(params);
  return postForm(FUNPAY_ENDPOINTS.query, params);
}

export type FunpayReasonCode = "R000" | "R001" | "R002" | "R003" | "R005";
// R000 단순변심 / R001 하자 / R002 결제오류 / R003 기타 / R005 망취소

/**
 * 결제 취소(환불) — /payment/refund.icb
 * 명세: refno 는 매 취소마다 새 유니크값. transid 는 원 결제 거래번호.
 * voidamt = 취소 금액(부분취소 가능). 전체취소면 reqamt 와 동일.
 */
export async function cancelPayment(input: {
  /** 새 유니크 취소 요청번호 (원 주문 refno 와 달라야 함) */
  refundRefno: string;
  /** 원 결제 거래번호 (transid) */
  transid: string;
  servicetype: string;
  reqcur: string;
  /** 원 결제 금액 */
  reqamt: string;
  /** 취소 금액 (전체취소면 reqamt 와 동일) */
  voidamt: string;
  reasoncode?: FunpayReasonCode;
  reasondesc?: string;
}): Promise<any> {
  const params: Record<string, string> = {
    ver: "V2",
    mid: FUNPAY_MID,
    servicetype: input.servicetype,
    refno: input.refundRefno,
    transid: input.transid,
    reqcur: input.reqcur,
    reqamt: input.reqamt,
    voidamt: input.voidamt,
    reasoncode: input.reasoncode ?? "R000",
    reasondesc: input.reasondesc ?? "",
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
