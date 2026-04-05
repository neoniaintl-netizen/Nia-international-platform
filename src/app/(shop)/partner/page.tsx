import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "파트너 지원" };

const PARTNER_SERVICES = [
  {
    title: "중국 입점 문의",
    description:
      "한국 브랜드의 중국 시장 진출을 NKBUS가 도와드립니다. 입점 심사부터 상품 등록, 마케팅까지 전 과정을 지원합니다.",
    details: [
      "입점 심사: 브랜드 적합성, 상품 경쟁력 평가",
      "상품 등록: 중국어 상세페이지 제작, 가격 설정 지원",
      "물류 연계: 한-중 배송 인프라 연결",
      "마케팅: 중국 SNS(위챗, 샤오홍슈) 마케팅 지원",
    ],
    cta: "입점 신청하기",
    href: "#",
    accent: "bg-black",
  },
  {
    title: "광고/제휴 문의",
    description:
      "NKBUS 플랫폼 내 광고 게재 및 브랜드 제휴 파트너십에 대해 안내드립니다.",
    details: [
      "배너 광고: 메인 히어로, 카테고리 배너",
      "기획전 참여: 시즌별 기획전, 브랜드 위크",
      "콘텐츠 제휴: 매거진, 스타일링 콘텐츠",
      "SNS 협업: 인플루언서 콜라보 캠페인",
    ],
    cta: "문의하기",
    href: "#",
    accent: "bg-blue-600",
  },
  {
    title: "도소매 문의",
    description:
      "NKBUS를 통한 골프웨어 및 패션 상품의 도매/소매 거래를 안내드립니다.",
    details: [
      "도매 거래: 최소 주문 수량 및 도매 가격 안내",
      "소매 거래: 개별 상품 판매 및 배송",
      "정기 거래: 월간/분기 정기 납품 계약",
      "맞춤 발주: 브랜드 맞춤 오더 메이드 서비스",
    ],
    cta: "문의하기",
    href: "#",
    accent: "bg-green-700",
  },
  {
    title: "공동/대량 구매 문의",
    description:
      "기업, 단체, 동호회 등의 공동 구매 및 대량 구매를 위한 특별 가격과 서비스를 제공합니다.",
    details: [
      "공동 구매: 10인 이상 단체 주문 할인",
      "대량 구매: 100개 이상 대량 발주 특별가",
      "커스텀 로고: 기업 로고 자수/프린팅 서비스",
      "전용 담당자: 대량 주문 전담 매니저 배정",
    ],
    cta: "문의하기",
    href: "#",
    accent: "bg-purple-700",
  },
];

export default function PartnerPage() {
  return (
    <div className="max-w-[960px] mx-auto px-4 lg:px-6 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-2">파트너 지원</h1>
      <p className="text-sm text-gray-500 mb-8">
        NKBUS와 함께 비즈니스를 성장시켜 보세요.
      </p>

      <div className="space-y-6">
        {PARTNER_SERVICES.map((service) => (
          <div
            key={service.title}
            className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className={`h-1.5 ${service.accent}`} />
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                {service.title}
              </h2>
              <p className="text-sm text-gray-600 mb-4">{service.description}</p>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <ul className="space-y-2">
                  {service.details.map((detail) => (
                    <li
                      key={detail}
                      className="text-xs text-gray-600 flex items-start gap-2"
                    >
                      <span className="text-gray-300 mt-0.5">&#8226;</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={service.href}
                className={`inline-block px-5 py-2 text-sm font-semibold text-white rounded-lg ${service.accent} hover:opacity-90 transition-opacity`}
              >
                {service.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* 문의 안내 */}
      <div className="mt-10 p-6 bg-gray-50 rounded-xl text-center">
        <p className="text-sm font-bold text-gray-700 mb-1">
          파트너십에 대해 더 궁금한 점이 있으신가요?
        </p>
        <p className="text-xs text-gray-500 mb-3">
          이메일 또는 전화로 편하게 문의해주세요.
        </p>
        <div className="flex items-center justify-center gap-4 text-sm">
          <span className="text-gray-600">sosexy76@naver.com</span>
          <span className="text-gray-300">|</span>
          <span className="font-bold text-gray-900">1544-7199</span>
        </div>
      </div>
    </div>
  );
}
