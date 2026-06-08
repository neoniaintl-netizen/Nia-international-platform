/**
 * 배송비 정책 — 단일 소스.
 * 장바구니(cart) / 체크아웃(checkout) / 주문생성(order) 이 모두 이 함수를 사용한다.
 * (화면만 바꾸면 실제 결제금액이 안 줄어들므로, 서버 order.ts 도 반드시 이 함수를 사용)
 *
 * ⚠️ FREE_SHIPPING_MODE = true : PG 테스트 동안 전체 무료배송(배송비 0원).
 *    운영 전 false 로 복구하면 아래 정상 정책으로 동작:
 *      - 상품합계 >= FREE_SHIPPING_THRESHOLD → 0원
 *      - 그 외(>0) → BASE_SHIPPING_FEE
 *      - 상품합계 0 → 0원
 */

/** PG 테스트용 전체 무료배송 스위치. 운영 전 false 로 복구. */
const FREE_SHIPPING_MODE = true;

/** 무료배송 기준 금액 (원). 정상 정책에서 이 금액 이상이면 무료. */
export const FREE_SHIPPING_THRESHOLD = 30000;
/** 기본 배송비 (원). 정상 정책. */
export const BASE_SHIPPING_FEE = 3000;

/** 상품 합계(subtotal, 원) 기준 배송비 계산. */
export function calculateShipping(subtotal: number): number {
  if (FREE_SHIPPING_MODE) return 0;
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : BASE_SHIPPING_FEE;
}

/** 배송비 안내 문구 (무료 적용 시 노출). */
export const SHIPPING_NOTICE = FREE_SHIPPING_MODE
  ? "무료배송 적용"
  : `${FREE_SHIPPING_THRESHOLD.toLocaleString()}원 이상 무료배송 적용`;
