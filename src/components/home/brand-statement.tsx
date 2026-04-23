import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Crown, Truck, Sparkles, Clock } from "lucide-react";

/**
 * NKBUS 멤버십 섹션 — 에디토리얼 스플릿 레이아웃
 * 좌측: 큰 타이틀 + CTA / 우측: 4개 혜택 리스트 + 등급 배지
 * 배경: 다크 그라디언트 + 샴페인 블러 글로우 + 대형 숫자 장식
 */

const BENEFITS = [
  {
    icon: Crown,
    title: "Exclusive Access",
    subtitle: "회원 독점 신상 · 한정판 선예약",
  },
  {
    icon: Truck,
    title: "Free Shipping",
    subtitle: "전 품목 무료 배송 · 당일 출고",
  },
  {
    icon: Sparkles,
    title: "Members Day",
    subtitle: "매달 멤버 전용 세일 · 최대 70% OFF",
  },
  {
    icon: Clock,
    title: "Early Preview",
    subtitle: "시즌 컬렉션 · 3일 우선 구매",
  },
];

export function BrandStatement() {
  return (
    <section className="relative overflow-hidden bg-[var(--ink)] text-white">
      {/* 배경 이미지 */}
      <Image
        src="/banners/앨범 1.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center pointer-events-none select-none"
      />
      {/* 어두운 오버레이 (텍스트 가독성) */}
      <div className="absolute inset-0 bg-black/70 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/70 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-white/10 blur-[180px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-white/5 blur-[160px] pointer-events-none" />

      {/* 배경 대형 숫자 장식 */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[320px] lg:text-[520px] font-bold text-white/[0.02] leading-none tracking-[-0.05em] pointer-events-none select-none num"
      >
        01
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 lg:px-8 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-20 items-center">
          {/* 좌측 */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px w-10 bg-white" />
              <p className="eyebrow text-white">
                NKBUS Membership
              </p>
            </div>

            <h2 className="text-5xl md:text-7xl lg:text-[88px] font-bold tracking-[-0.03em] leading-[0.95] mb-8">
              한국 패션,
              <br />
              <span className="inline-block relative">
                세계로
                <span className="text-white">.</span>
              </span>
            </h2>

            <p className="text-sm lg:text-base text-white/60 max-w-lg leading-relaxed mb-10">
              NKBUS 회원만을 위한 특별한 혜택을 만나보세요.
              <br className="hidden sm:block" />
              독점 컬렉션, 프리미엄 서비스, 멤버스 데이 — 가입 즉시 시작됩니다.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/membership"
                className="group inline-flex items-center gap-3 px-8 h-14 bg-white text-[var(--ink)] text-[11px] font-semibold uppercase tracking-[0.25em] hover:bg-white transition-colors"
              >
                Join Membership
                <ArrowRight
                  className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                  strokeWidth={2}
                />
              </Link>
              <Link
                href="/stores"
                className="group inline-flex items-center gap-3 px-8 h-14 bg-transparent border border-white/30 text-white text-[11px] font-medium uppercase tracking-[0.25em] hover:bg-white/5 hover:border-white transition-colors"
              >
                Find Stores
                <ArrowRight
                  className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                  strokeWidth={1.5}
                />
              </Link>
            </div>
          </div>

          {/* 우측: 혜택 리스트 */}
          <div className="lg:pl-8">
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent hidden lg:block" />

              <ul className="space-y-6 lg:space-y-8 lg:pl-10">
                {BENEFITS.map((b, idx) => (
                  <li
                    key={b.title}
                    className="group flex items-start gap-5 lg:gap-6"
                  >
                    <div className="shrink-0 w-12 h-12 flex items-center justify-center border border-white/20 bg-white/[0.03] group-hover:border-white group-hover:bg-white/10 transition-colors">
                      <b.icon
                        className="w-5 h-5 text-white"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] text-white/30 num">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <h3 className="text-sm lg:text-base font-semibold tracking-wide">
                          {b.title}
                        </h3>
                      </div>
                      <p className="text-[13px] text-white/50 leading-relaxed">
                        {b.subtitle}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* 등급 배지 */}
            <div className="mt-10 lg:ml-10 inline-flex items-center gap-4 text-[11px] uppercase tracking-[0.2em] text-white/40">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CD7F32]" />
                Bronze
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C0C0C0]" />
                Silver
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                Platinum
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
