import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, HelpCircle, Shield, Phone, Mail } from "lucide-react";

export const metadata: Metadata = { title: "고객 지원" };

const SUPPORT_MENU = [
  {
    icon: MessageCircle,
    title: "1:1 문의하기",
    description: "궁금한 점을 1:1로 문의해주세요. 영업일 기준 24시간 내 답변드립니다.",
    href: "#",
    cta: "문의하기",
  },
  {
    icon: HelpCircle,
    title: "자주 묻는 질문 (FAQ)",
    description: "주문, 배송, 반품, 구매대행 등 자주 묻는 질문을 확인하세요.",
    href: "/faq",
    cta: "FAQ 보기",
  },
  {
    icon: Shield,
    title: "안전 거래 센터",
    description: "NOVAREN는 안전한 거래 환경을 위해 에스크로 결제, 정품 인증, 개인정보 보호를 제공합니다.",
    href: "#",
    cta: "자세히 보기",
  },
];

const SAFETY_FEATURES = [
  {
    title: "에스크로 결제",
    description: "고객님의 결제 금액은 상품 수령 확인 후 판매자에게 지급됩니다.",
  },
  {
    title: "정품 인증",
    description: "모든 상품은 NOVAREN 정품 인증 절차를 거쳐 발송됩니다.",
  },
  {
    title: "개인정보 보호",
    description: "관련 법령에 따른 안전한 개인정보 관리 체계를 운영합니다.",
  },
  {
    title: "통관 대행",
    description: "해외 배송 시 통관 절차를 NOVAREN에서 대행합니다.",
  },
];

export default function SupportPage() {
  return (
    <div className="max-w-[960px] mx-auto px-4 lg:px-6 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-2">고객 지원</h1>
      <p className="text-sm text-gray-500 mb-8">
        도움이 필요하시면 언제든지 연락해주세요.
      </p>

      {/* 연락처 */}
      <div className="bg-black text-white rounded-xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-white/60 mb-1">고객센터</p>
            <p className="text-2xl font-black">1544-7199</p>
            <p className="text-xs text-white/50 mt-1">
              평일 09:00 - 18:00 (점심시간 12:00 - 13:00 제외)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/80">sosexy76@naver.com</span>
          </div>
        </div>
      </div>

      {/* 지원 메뉴 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {SUPPORT_MENU.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="border rounded-xl p-5 hover:border-black hover:shadow-md transition-all group"
          >
            <item.icon className="w-6 h-6 text-gray-400 mb-3 group-hover:text-black transition-colors" />
            <h3 className="text-sm font-bold text-gray-900 mb-2">{item.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              {item.description}
            </p>
            <span className="text-xs font-semibold text-black underline underline-offset-2">
              {item.cta} &rarr;
            </span>
          </Link>
        ))}
      </div>

      {/* 안전 거래 */}
      <section>
        <h2 className="text-lg font-black text-gray-900 mb-4">안전 거래 안내</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SAFETY_FEATURES.map((feature) => (
            <div key={feature.title} className="bg-gray-50 rounded-xl p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-1">
                {feature.title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
