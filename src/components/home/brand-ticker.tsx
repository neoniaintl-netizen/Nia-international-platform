import Link from "next/link";

interface BrandItem {
  name: string;
  slug: string;
  highlight?: boolean;
}

const DEFAULT_BRANDS: BrandItem[] = [
  // 1차 핵심 카테고리 = 골프 → 골프 brand 우선 노출
  { name: "MALBON GOLF", slug: "malbongolf", highlight: true },
  { name: "G/FORE", slug: "gfore" },
  { name: "ANEW GOLF", slug: "anewgolf" },
  { name: "WAAC", slug: "waac" },
  { name: "TITLEIST", slug: "titleist" },
  { name: "MARK & LONA", slug: "markandlona" },
  // 후순위 — 다른 카테고리 brand
  { name: "SALOMON", slug: "salomon" },
  { name: "THE NORTH FACE", slug: "thenorthface" },
  { name: "PATAGONIA", slug: "patagonia" },
  { name: "ARC'TERYX", slug: "arcteryx" },
  { name: "DESCENTE", slug: "descente" },
  { name: "WILSON", slug: "wilson" },
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
          {doubled.map((b, i) => (
            <Link
              key={`${b.slug}-${i}`}
              href={`/brands/${b.slug}`}
              className="group shrink-0 px-10 lg:px-14 flex items-center gap-10 lg:gap-14"
            >
              <span
                className={`text-[13px] lg:text-[15px] uppercase tracking-[0.2em] font-medium transition-colors ${
                  b.highlight
                    ? "text-white"
                    : "text-white/60 group-hover:text-white"
                }`}
              >
                {b.name}
              </span>
              <span className="text-white/20 text-xs select-none">·</span>
            </Link>
          ))}
        </div>

        {/* 양쪽 페이드 마스크 */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--ink)] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--ink)] to-transparent z-10" />
      </div>
    </section>
  );
}
