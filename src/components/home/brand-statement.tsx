import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * G/FORE 스타일 브랜드 스테이트먼트 섹션
 * 큰 타이틀 + 멤버십/스토어 CTA
 */
export function BrandStatement() {
  return (
    <section className="py-16 lg:py-28 bg-[var(--ink)] text-white">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 text-center">
        <p className="eyebrow text-[var(--champagne)] mb-6">
          NKBUS Membership
        </p>

        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-[-0.02em] leading-[1.05] mb-6">
          한국 패션,
          <br />
          세계로.
        </h2>

        <p className="text-[13px] lg:text-sm text-white/60 max-w-xl mx-auto leading-relaxed mb-10">
          NKBUS 회원만을 위한 특별한 혜택.
          <br className="hidden sm:block" />
          독점 컬렉션, 프리미엄 서비스, 멤버스 데이까지 — 가입 즉시 시작됩니다.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/membership"
            className="inline-flex items-center gap-2 px-8 h-12 bg-[var(--champagne)] text-white text-[11px] font-medium uppercase tracking-[0.2em] hover:bg-[var(--champagne-soft)] transition-colors"
          >
            Membership
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
          <Link
            href="/stores"
            className="inline-flex items-center gap-2 px-8 h-12 bg-transparent border border-white/40 text-white text-[11px] font-medium uppercase tracking-[0.2em] hover:bg-white/10 hover:border-white transition-colors"
          >
            Stores
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </section>
  );
}
