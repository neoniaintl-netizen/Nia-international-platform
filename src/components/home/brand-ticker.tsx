import Link from "next/link";

interface BrandItem {
  name: string;
  /** 입점 brand 의 실제 slug. null = 미입점(표시만, 링크 없음 → 404 방지) */
  slug: string | null;
  highlight?: boolean;
}

// slug 는 실제 brand 페이지(/brands/[slug])가 존재하는 값만. 미입점은 null(표시만).
const DEFAULT_BRANDS: BrandItem[] = [
  // 1차 핵심 카테고리 = 골프 → 골프 brand 우선 노출
  { name: "MALBON GOLF", slug: null, highlight: true }, // 미입점
  { name: "G/FORE", slug: null }, // 미입점
  { name: "ANEW GOLF", slug: "anewgolf" },
  { name: "WAAC", slug: null }, // 미입점
  { name: "TITLEIST", slug: null }, // 미입점
  { name: "MARK & LONA", slug: "markandlona-korea" }, // slug 수정 (markandlona → markandlona-korea)
  // 후순위 — 다른 카테고리 brand
  { name: "SALOMON", slug: "salomon" }, // 24
  { name: "THE NORTH FACE", slug: "thenorthface" }, // 22
  { name: "PATAGONIA", slug: null }, // 상품 0 → 표시만
  { name: "ARC'TERYX", slug: "arcteryx" }, // 20
  { name: "DESCENTE", slug: null }, // 상품 0 → 표시만
  { name: "WILSON", slug: "wilson" }, // 15
];

/**
 * Hero 배너 아래 자동 스크롤되는 브랜드 티커.
 * 무한 루프를 위해 동일한 리스트를 두 번 이어 붙임.
 */
export function BrandTicker({
  brands = DEFAULT_BRANDS,
}: {
  brands?: BrandItem[];
}) {
  // marquee는 절반 지점에서 끊김 없이 반복되려면 리스트 x2
  const doubled = [...brands, ...brands];

  return (
    <section className="bg-[var(--ink)] text-white border-y border-white/10 overflow-hidden">
      <div className="relative flex items-center h-12 lg:h-14">
        <div className="flex animate-brand-ticker whitespace-nowrap">
          {doubled.map((b, i) => {
            const cls =
              "group shrink-0 px-10 lg:px-14 flex items-center gap-10 lg:gap-14";
            const inner = (
              <>
                <span
                  className={`text-[13px] lg:text-[15px] uppercase tracking-[0.2em] font-medium transition-colors ${
                    b.highlight
                      ? "text-white"
                      : b.slug
                        ? "text-white/60 group-hover:text-white"
                        : "text-white/40" // 미입점 — 클릭 불가, 흐리게
                  }`}
                >
                  {b.name}
                </span>
                <span className="text-white/20 text-xs select-none">·</span>
              </>
            );
            // 입점 brand 만 링크(/brands/[slug]), 미입점은 표시만 → 404 방지
            return b.slug ? (
              <Link key={`${b.name}-${i}`} href={`/brands/${b.slug}`} className={cls}>
                {inner}
              </Link>
            ) : (
              <span key={`${b.name}-${i}`} className={`${cls} cursor-default`}>
                {inner}
              </span>
            );
          })}
        </div>

        {/* 양쪽 페이드 마스크 */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--ink)] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--ink)] to-transparent z-10" />
      </div>
    </section>
  );
}
