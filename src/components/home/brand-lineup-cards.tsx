import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/home/section-header";
import { thumbUrl } from "@/lib/image-url";
import type { BrandLineupItem } from "@/lib/queries";
import { BRAND_LINEUP_COPY } from "@/lib/home-config";

/**
 * §5 주목할 브랜드 라인업 — 더카트 "주목할 만한 브랜드 라인업" 대응.
 * 3×2 에디토리얼 카드: 대표 이미지(최신 상품 메인컷 fallback) + 브랜드명 + 로케일별 카피 + 상품 수.
 */
export async function BrandLineupCards({ brands }: { brands: BrandLineupItem[] }) {
  if (brands.length === 0) return null;
  const t = await getTranslations("Home");
  const locale = await getLocale();
  const copyMap = BRAND_LINEUP_COPY[locale] ?? BRAND_LINEUP_COPY.ko;

  return (
    <section className="max-w-[1360px] mx-auto px-4 lg:px-8 py-12 lg:py-20">
      <SectionHeader
        eyebrow="Brand Lineup"
        title={t("v2LineupTitle")}
        subtitle={t("v2LineupSubtitle")}
        linkHref="/brands"
        linkLabel="All Brands"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 lg:gap-x-6 lg:gap-y-12">
        {brands.map((b) => {
          const copy = copyMap[b.slug];
          return (
            <Link key={b.slug} href={`/brands/${b.slug}`} className="group block">
              <div className="relative aspect-[4/3] bg-[var(--stone)] border border-[var(--line)] overflow-hidden mb-4">
                {b.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={thumbUrl(b.imageUrl, 800)}
                    alt={b.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[700ms] ease-out"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl lg:text-3xl font-bold uppercase tracking-[0.1em] text-[var(--ink)]/15">
                      {b.name}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.04] transition-colors duration-500 pointer-events-none" />
              </div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--ink-muted)] mb-1.5">
                {b.name}
              </p>
              <p className="text-[17px] lg:text-lg tracking-tight text-[var(--ink)]">
                {copy?.title ?? (b.nameKo ?? b.name)}
              </p>
              <p className="text-[12px] text-[var(--ink-muted)] mt-1">
                {copy?.subtitle ?? b.name} ·{" "}
                {t("v2LineupCount", { count: b.productCount })}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
