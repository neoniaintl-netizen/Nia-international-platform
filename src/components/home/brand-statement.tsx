import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShoppingBag, Store, ShieldCheck, Headphones } from "lucide-react";

/**
 * NOVAREN Sourcing System 섹션 — 에디토리얼 스플릿 레이아웃.
 * 좌측: 큰 타이틀 + CTA / 우측: 4단계 소싱 프로세스 + 하단 step badge.
 *
 * 메시지 컨셉:
 *   "실시간 재고 쇼핑몰이 아니라, 주문 후 오프라인 매장에서 상품을 확보해 검수 후 출고"
 *   = 큐레이션 → 매장 소싱 → 검수 → 출고 (CURATE · SOURCE · VERIFY · SHIP)
 */

const STEPS = [
  {
    icon: ShoppingBag,
    title: "Curated Selection",
    subtitle: "검증된 브랜드 상품 중심 큐레이션",
  },
  {
    icon: Store,
    title: "Store Sourcing",
    subtitle: "주문 후 오프라인 매장 재고 확인",
  },
  {
    icon: ShieldCheck,
    title: "Quality Check",
    subtitle: "상품 확보 후 검수 및 출고",
  },
  {
    icon: Headphones,
    title: "Buyer Support",
    subtitle: "국내·해외 바이어 주문 지원",
  },
];

export function BrandStatement() {
  return (
    <section className="relative overflow-hidden bg-[var(--ink)] text-white">
      {/* 배경 이미지 — banner-4 (JPG, 88% 압축) */}
      <Image
        src="/banners/banner-4.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center pointer-events-none select-none"
      />
      {/* 가독성 오버레이 — 기존 대비 살짝 약하게 (이미지 시각 강조) */}
      <div className="absolute inset-0 bg-black/55 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/30 to-black/60 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-white/[0.06] blur-[180px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-white/[0.04] blur-[160px] pointer-events-none" />

      {/* 배경 대형 숫자 장식 */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[320px] lg:text-[520px] font-bold text-white/[0.025] leading-none tracking-[-0.05em] pointer-events-none select-none num"
      >
        S
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 lg:px-8 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-20 items-center">
          {/* 좌측 */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px w-10 bg-white" />
              <p className="eyebrow text-white">NOVAREN Sourcing System</p>
            </div>

            <h2 className="text-4xl md:text-6xl lg:text-[78px] font-bold tracking-[-0.03em] leading-[0.98] mb-8">
              브랜드를 고르고,
              <br />
              매장에서 확보합니다
              <span className="text-white">.</span>
            </h2>

            <p className="text-sm lg:text-base text-white/65 max-w-xl leading-relaxed mb-10">
              NOVAREN는 골프·스포츠·아웃도어 브랜드 상품을 큐레이션하고,
              <br className="hidden sm:block" />
              주문 후 오프라인 매장 재고 확인과 상품 확보 과정을 거쳐 출고합니다.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/brands"
                className="group inline-flex items-center gap-3 px-8 h-14 bg-white text-[var(--ink)] text-[11px] font-semibold uppercase tracking-[0.25em] hover:bg-white/90 transition-colors"
              >
                Shop Brands
                <ArrowRight
                  className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                  strokeWidth={2}
                />
              </Link>
              <Link
                href="/about"
                className="group inline-flex items-center gap-3 px-8 h-14 bg-transparent border border-white/30 text-white text-[11px] font-medium uppercase tracking-[0.25em] hover:bg-white/5 hover:border-white transition-colors"
              >
                How It Works
                <ArrowRight
                  className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                  strokeWidth={1.5}
                />
              </Link>
            </div>
          </div>

          {/* 우측: 소싱 4단계 */}
          <div className="lg:pl-8">
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent hidden lg:block" />

              <ul className="space-y-6 lg:space-y-8 lg:pl-10">
                {STEPS.map((s, idx) => (
                  <li
                    key={s.title}
                    className="group flex items-start gap-5 lg:gap-6"
                  >
                    <div className="shrink-0 w-12 h-12 flex items-center justify-center border border-white/20 bg-white/[0.03] group-hover:border-white group-hover:bg-white/10 transition-colors">
                      <s.icon
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
                          {s.title}
                        </h3>
                      </div>
                      <p className="text-[13px] text-white/55 leading-relaxed">
                        {s.subtitle}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* 하단 step badge */}
            <div className="mt-10 lg:ml-10 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-white/45">
              <span>Curate</span>
              <span className="text-white/20">·</span>
              <span>Source</span>
              <span className="text-white/20">·</span>
              <span>Verify</span>
              <span className="text-white/20">·</span>
              <span>Ship</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
