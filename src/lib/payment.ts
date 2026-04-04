// =====================================================
// PortOne(아임포트) V2 결제 설정
// 실제 운영 시 .env 파일에 값을 설정하세요
// =====================================================

export const PORTONE_CONFIG = {
  // TODO: 실제 PortOne 가맹점 식별코드로 교체
  // PortOne 콘솔 > 결제 연동 > 식별코드 에서 확인
  storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID || "imp00000000",
  // TODO: 실제 채널 키로 교체
  // PortOne 콘솔 > 결제 연동 > 채널 관리 에서 확인
  channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || "",
};

// PortOne V2 서버 API 설정
export const PORTONE_API = {
  // TODO: 실제 API 시크릿으로 교체
  // PortOne 콘솔 > 결제 연동 > API Keys 에서 확인
  secret: process.env.PORTONE_API_SECRET || "",
  baseUrl: "https://api.portone.io",
};

/**
 * 주문 고유번호(merchant_uid) 생성
 * 형식: ORDER-YYYYMMDD-XXXXXXX
 */
export function generateMerchantUid() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `ORDER-${date}-${rand}`;
}

/**
 * 결제 수단별 PG사 매핑
 * PortOne V2에서는 channelKey로 PG사를 구분하지만,
 * payMethod는 여전히 필요합니다.
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
