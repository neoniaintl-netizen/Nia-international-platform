import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "결제 혜택",
};

const PAYMENT_EVENTS = [
  {
    id: 1,
    title: "NKBUSPay 첫 결제 혜택",
    description: "NKBUSPay 첫 결제 시 5,000원 즉시 할인",
    period: "2026.04.01 ~ 2026.04.30",
    badge: "진행중",
    conditions: ["NKBUSPay 첫 결제 고객 대상", "최소 결제금액 30,000원 이상", "1인 1회 한정"],
    bgColor: "#000",
  },
  {
    id: 2,
    title: "카카오페이 × 페이머니 할인",
    description: "카카오페이 페이머니 10만원 이상 결제 시 4,000원 할인",
    period: "2026.04.01 ~ 2026.04.30",
    badge: "진행중",
    conditions: ["카카오페이 페이머니 결제 시 적용", "월 1회, 선착순 2,000명"],
    bgColor: "#FEE500",
  },
  {
    id: 3,
    title: "AliPay 위안화 직결제",
    description: "AliPay 결제 시 위안화 직결제 지원 · 환율 우대 혜택",
    period: "상시 진행",
    badge: "상시",
    conditions: ["AliPay 계정 보유 고객 대상", "위안화 직결제로 환전 수수료 절감"],
    bgColor: "#1677FF",
  },
  {
    id: 4,
    title: "WeChat Pay 결제 혜택",
    description: "WeChat Pay 5만원 이상 결제 시 3,000원 할인",
    period: "2026.04.01 ~ 2026.06.30",
    badge: "진행중",
    conditions: ["WeChat Pay 결제 시 자동 적용", "월 2회, 기간 내 무제한"],
    bgColor: "#07C160",
  },
  {
    id: 5,
    title: "VISA / Mastercard 해외카드 혜택",
    description: "해외 발급 VISA·Mastercard 결제 시 무료배송 쿠폰 지급",
    period: "2026.04.01 ~ 2026.05.31",
    badge: "진행중",
    conditions: ["해외 발급 카드 결제 완료 후 자동 지급", "무료배송 쿠폰 1매 (7일 유효)"],
    bgColor: "#1A1F71",
  },
];

const SUPPORTED_METHODS = [
  "VISA", "Mastercard", "JCB", "AMEX", "AliPay", "WeChat Pay", "NKBUSPay", "KakaoPay",
];

export default function PaymentEventPage() {
  return (
    <div className="max-w-[960px] mx-auto px-4 lg:px-6 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">결제 혜택</h1>
        <p className="text-sm text-gray-500 mt-1">
          NKBUS에서 제공하는 다양한 결제 혜택을 확인하세요.
        </p>
      </div>

      {/* 지원 결제수단 */}
      <div className="mb-8 p-5 bg-gray-50 rounded-xl">
        <h2 className="text-sm font-bold text-gray-700 mb-3">지원 결제수단</h2>
        <div className="flex flex-wrap items-center gap-2">
          {SUPPORTED_METHODS.map((method) => (
            <span
              key={method}
              className="inline-block px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md text-gray-600 bg-white"
            >
              {method}
            </span>
          ))}
        </div>
      </div>

      {/* 이벤트 목록 */}
      <div className="space-y-4">
        {PAYMENT_EVENTS.map((event) => (
          <div
            key={event.id}
            className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* 컬러 바 */}
            <div className="h-2" style={{ backgroundColor: event.bgColor }} />

            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-gray-900">
                      {event.title}
                    </h3>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        event.badge === "상시"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {event.badge}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{event.description}</p>
                  <p className="text-xs text-gray-400 mt-2">{event.period}</p>
                </div>
              </div>

              {/* 조건 */}
              <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
                <ul className="space-y-1">
                  {event.conditions.map((cond) => (
                    <li key={cond} className="text-xs text-gray-500 flex items-start gap-1.5">
                      <span className="text-gray-300 mt-0.5">&#8226;</span>
                      {cond}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 유의사항 */}
      <div className="mt-10 p-5 bg-gray-50 rounded-xl">
        <h2 className="text-sm font-bold text-gray-700 mb-3">유의사항</h2>
        <ul className="space-y-1.5 text-xs text-gray-400">
          <li>&#8226; 각 혜택은 예산 소진 시 조기 종료될 수 있습니다.</li>
          <li>&#8226; 결제 혜택은 다른 프로모션과 중복 적용이 제한될 수 있습니다.</li>
          <li>&#8226; 주문 취소 또는 반품 시 혜택이 회수될 수 있습니다.</li>
          <li>&#8226; 자세한 내용은 각 결제사 이벤트 페이지를 참고해주세요.</li>
        </ul>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-black underline underline-offset-4"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
