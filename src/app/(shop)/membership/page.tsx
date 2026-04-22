import Link from "next/link";
import { Gift, Truck, Star, Crown, Award } from "lucide-react";
import { ChevronRight } from "lucide-react";

const TIERS = [
  {
    level: "LV.1",
    name: "BRONZE",
    color: "from-amber-700 to-amber-900",
    textColor: "text-amber-900",
    condition: "가입 즉시",
    benefits: [
      { icon: "💰", label: "구매 적립 1%" },
      { icon: "🚚", label: "무료배송 (3만원 이상)" },
      { icon: "🎁", label: "신규 회원 쿠폰" },
      { icon: "📦", label: "첫 구매 10% 할인" },
    ],
  },
  {
    level: "LV.2",
    name: "SILVER",
    color: "from-gray-400 to-gray-600",
    textColor: "text-gray-700",
    condition: "누적 구매 50만원",
    benefits: [
      { icon: "💰", label: "구매 적립 2%" },
      { icon: "🚚", label: "무료배송" },
      { icon: "🎁", label: "월간 전용 쿠폰" },
      { icon: "🎂", label: "생일 축하 쿠폰" },
      { icon: "⚡", label: "우선 배송" },
    ],
  },
  {
    level: "LV.3",
    name: "GOLD",
    color: "from-yellow-500 to-amber-600",
    textColor: "text-yellow-700",
    condition: "누적 구매 200만원",
    benefits: [
      { icon: "💰", label: "구매 적립 3%" },
      { icon: "🚚", label: "무료배송 + 당일배송" },
      { icon: "👑", label: "VIP 전용 쿠폰" },
      { icon: "🎂", label: "생일 축하 쿠폰 (2배)" },
      { icon: "🛎️", label: "전담 상담원 배정" },
      { icon: "🎟️", label: "한정판 발매 선구매권" },
    ],
  },
];

const PERKS = [
  {
    icon: Gift,
    title: "신규 가입 즉시 쿠폰",
    desc: "가입만으로 첫 구매 10% 할인 쿠폰과 웰컴 포인트 2,000P 지급",
  },
  {
    icon: Truck,
    title: "무료 배송 혜택",
    desc: "BRONZE 등급부터 3만원 이상 구매 시 전국 무료배송. 중국 직배송도 동일 조건",
  },
  {
    icon: Star,
    title: "적립금 최대 3%",
    desc: "등급이 오를수록 적립률 상승. GOLD 회원은 매 구매마다 3% 적립",
  },
  {
    icon: Crown,
    title: "VIP 독점 혜택",
    desc: "한정판 발매 선구매, 시크릿 세일 초대, 전담 상담원 배정 등 GOLD 전용 서비스",
  },
];

export const metadata = {
  title: "멤버십 | NKBUS",
  description:
    "NKBUS 멤버십 등급별 혜택 — BRONZE, SILVER, GOLD. 구매할수록 쌓이는 포인트와 쿠폰, 무료배송까지.",
};

export default function MembershipPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-8 lg:py-14">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
        <Link href="/" className="hover:text-black">홈</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-black font-medium">멤버십</span>
      </div>

      {/* Hero */}
      <div className="text-center mb-12 lg:mb-20">
        <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-1.5 rounded-full text-xs font-bold mb-4">
          <Crown className="w-3 h-3" />
          NKBUS MEMBERSHIP
        </div>
        <h1 className="text-3xl lg:text-5xl font-black mb-4">
          쇼핑할수록 커지는 혜택
        </h1>
        <p className="text-sm lg:text-base text-gray-600 max-w-xl mx-auto">
          NKBUS 멤버십은 구매 금액에 따라 3단계 등급으로 올라가며,
          <br className="hidden sm:block" />
          등급이 오를수록 적립률·배송·쿠폰 혜택이 확대됩니다.
        </p>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
        {TIERS.map((tier, i) => (
          <div
            key={tier.name}
            className={`relative rounded-2xl p-6 lg:p-8 border-2 ${
              i === 2 ? "border-yellow-500" : "border-gray-200"
            }`}
          >
            {i === 2 && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white px-3 py-1 rounded-full text-[10px] font-bold">
                BEST
              </div>
            )}
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-5`}
            >
              <Award className="w-8 h-8 text-white" />
            </div>
            <p className="text-xs font-bold text-gray-400">{tier.level}</p>
            <h2 className={`text-2xl font-black ${tier.textColor} mb-2`}>
              {tier.name}
            </h2>
            <p className="text-xs text-gray-500 mb-6 pb-6 border-b">
              {tier.condition}
            </p>
            <ul className="space-y-3">
              {tier.benefits.map((b) => (
                <li key={b.label} className="flex items-center gap-3 text-sm">
                  <span className="text-base">{b.icon}</span>
                  <span className="text-gray-700">{b.label}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Perks */}
      <div className="bg-gray-50 rounded-3xl p-6 lg:p-12 mb-14">
        <h2 className="text-xl lg:text-2xl font-black text-center mb-8 lg:mb-10">
          모든 회원이 누리는 공통 혜택
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {PERKS.map((perk) => (
            <div
              key={perk.title}
              className="bg-white rounded-xl p-5 flex gap-4 items-start"
            >
              <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                <perk.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold mb-1">{perk.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {perk.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 등급 산정 기준 */}
      <div className="border rounded-2xl p-6 lg:p-8 mb-10">
        <h3 className="font-bold mb-4">등급 산정 기준</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• 최근 12개월 동안의 누적 구매 금액을 기준으로 매월 1일 자동 산정됩니다.</li>
          <li>• 주문 취소·반품 금액은 누적에서 제외됩니다.</li>
          <li>• 등급이 상승하면 즉시 혜택이 적용되며, 하락 시 다음 달 1일부터 반영됩니다.</li>
          <li>• 포인트는 구매 확정 후 7일 이내에 자동 적립되며, 1포인트=1원으로 사용할 수 있습니다.</li>
          <li>• 적립된 포인트의 유효기간은 최종 사용일로부터 1년입니다.</li>
        </ul>
      </div>

      <div className="text-center">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 bg-black text-white px-8 h-12 rounded-full font-bold text-sm hover:bg-gray-800 transition-colors"
        >
          지금 회원가입하고 혜택 받기
          <ChevronRight className="w-4 h-4" />
        </Link>
        <p className="text-xs text-gray-400 mt-3">
          이미 회원이신가요?{" "}
          <Link href="/my" className="text-black underline">
            내 등급 확인하기
          </Link>
        </p>
      </div>
    </div>
  );
}
