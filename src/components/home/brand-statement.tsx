import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShoppingBag, Store, ShieldCheck, Headphones } from "lucide-react";

/**
 * NOVAREN Sourcing System 섹션 — 프리미엄 에디토리얼 스플릿 레이아웃.
 * 좌측: 큰 타이틀 + CTA / 우측: 4단계 소싱 프로세스(프로스티드 글래스 패널) / 하단: full-width 키워드 띠.
 *
 * 메시지 컨셉:
 *   "실시간 재고 쇼핑몰이 아니라, 주문 후 오프라인 매장에서 상품을 확보해 검수 후 출고"
 *   = 큐레이션 → 매장 소싱 → 검수 → 출고 (CURATE · SOURCE · VERIFY · SHIP)
 */

const STEPS = [
  { icon: ShoppingBag, title: "Curated Selection", subtitle: "검증된 브랜드 상품 중심 큐레이션" },
  { icon: Store, title: "Store Sourcing", subtitle: "주문 후 오프라인 매장 재고 확인" },
  { icon: ShieldCheck, title: "Quality Check", subtitle: "상품 확보 후 검수 및 출고" },
  { icon: Headphones, title: "Buyer Support", subtitle: "국내·해외 바이어 주문 지원" },
];

const FLOW = ["Curate", "Source", "Verify", "Ship"];

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
      {/* 가독성 오버레이 */}
      <div className="absolute inset-0 bg-black/55 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/30 to-black/60 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-white/[0.06] blur-[180px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-white/[0.04] blur-[160px] pointer-events-none" />

      {/* 배경 대형 'S' — 묵직한 면 대신 얇은 아웃라인으로 (프리미엄). 우측 패널 뒤로 */}
      <div
        aria-hidden
        style={{ WebkitTextStroke: "1.5px rgba(255,255,255,0.08)", color: "transparent" }}
        className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-[12%] text-[260px] sm:text-[320px] lg:text-[560px] font-bold leading-none tracking-[-0.05em] pointer-events-none select-none num"
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

            {/* 마침표 제거 — 줄바꿈 리듬으로 단정함. 쉼표는 두 절을 잇는 구분으로 유지 */}
            <h2 className="text-4xl md:text-6xl lg:text-[78px] font-bold tracking-[-0.03em] leading-[0.98] mb-8">
              브랜드를 고르고,
              <br />
              매장에서 확보합니다
            </h2>

            <p className="text-sm lg:text-base text-white/65 max-w-xl leading-relaxed mb-10">
              NOVAREN는 골프·스포츠·아웃도어 브랜드 상품을 큐레이션하고,
              <br className="hidden sm:block" />
              주문 후 오프라인 매장 재고 확인과 상품 확보 과정을 거쳐 출고합니다.
            </p>

            {/* CTA 위계: 주(채움) 크게 / 보조(텍스트 링크) */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link
                href="/brands"
                className="group inline-flex items-center gap-3 px-10 h-14 bg-white text-[var(--ink)] text-[11px] font-bold uppercase tracking-[0.25em] hover:bg-white/90 transition-colors"
              >
                Shop Brands
                <ArrowRight
                  className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                  strokeWidth={2}
                />
              </Link>
              <Link
                href="/about"
                className="group inline-flex items-center gap-2 text-white/60 text-[11px] font-medium uppercase tracking-[0.25em] hover:text-white transition-colors"
              >
                How It Works
                <ArrowRight
                  className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                  strokeWidth={1.5}
                />
              </Link>
            </div>
          </div>

          {/* 우측: 소싱 4단계 — 프로스티드 글래스 패널 (라이트 엣지 + 호버 인터랙션) */}
          <div className="lg:pl-8">
            <div className="relative border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-transparent backdrop-blur-md">
              {/* 상단 라이트 엣지 — 가운데가 밝은 헤어라인 */}
              <span
                aria-hidden
                className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent"
              />
              <ul className="divide-y divide-white/[0.07]">
                {STEPS.map((s, idx) => (
                  <li
                    key={s.title}
                    className="group relative flex items-start gap-5 p-6 lg:p-7 transition-colors hover:bg-white/[0.03]"
                  >
                    {/* 호버 시 좌측 액센트 바 */}
                    <span
                      aria-hidden
                      className="absolute left-0 top-0 bottom-0 w-[2px] bg-white origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-300"
                    />
                    <div className="shrink-0 w-12 h-12 flex items-center justify-center border border-white/20 bg-white/[0.04] group-hover:bg-white group-hover:border-white transition-colors">
                      <s.icon
                        className="w-5 h-5 text-white group-hover:text-[var(--ink)] transition-colors"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="text-[11px] tracking-[0.25em] text-white/40 num">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span aria-hidden className="h-px w-5 bg-white/25" />
                        <h3 className="text-sm lg:text-base font-semibold tracking-wide">
                          {s.title}
                        </h3>
                      </div>
                      <p className="text-[13px] text-white/55 leading-relaxed">{s.subtitle}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 하단 full-width 키워드 띠 — 4단계 → 4키워드 (01~04 번호로 연결) */}
        <div className="mt-14 lg:mt-20 pt-8 border-t border-white/10">
          <ul className="flex flex-wrap items-center justify-center lg:justify-between gap-x-8 gap-y-3 text-[11px] uppercase tracking-[0.32em] text-white/45">
            {FLOW.map((w, i) => (
              <li key={w} className="flex items-center gap-3">
                <span className="text-white/25 num text-[10px]">{String(i + 1).padStart(2, "0")}</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
