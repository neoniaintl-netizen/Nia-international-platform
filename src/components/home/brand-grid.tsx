import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/home/section-header";
import type { BrandGridItem } from "@/lib/queries";

/**
 * §10 취급 브랜드 그리드 — 더카트 "지금 가장 핫한 브랜드" 대응.
 * 로고 있으면 로고 카드, 없으면 타이포 네임카드. ACTIVE 상품 보유 브랜드 우선.
 */
export async function BrandGrid({ brands }: { brands: BrandGridItem[] }) {
  // 홈에는 실제 판매 상품이 있는 브랜드만 (빈 브랜드 페이지 진입 방지). 전체는 /brands.
  const withProducts = brands.filter((b) => b.productCount > 0);
  if (withProducts.length === 0) return null;
  const t = await getTranslations("Home");

  return (
    <section className="max-w-[1360px] mx-auto px-4 lg:px-8 py-12 lg:py-20">
      <SectionHeader
        eyebrow="Our Brands"
        title={t("v2BrandsTitle")}
        subtitle={t("v2BrandsSubtitle")}
        linkHref="/brands"
        linkLabel="All Brands"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
        {withProducts.map((b) => (
          <Link
            key={b.slug}
            href={`/brands/${b.slug}`}
            className="group flex flex-col items-center justify-center h-28 lg:h-32 border border-[var(--line)] px-4 hover:border-[var(--ink)] transition-colors"
          >
            {b.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={b.logoUrl}
                alt={b.name}
                className="max-h-8 lg:max-h-9 w-auto max-w-[70%] object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className="text-[13px] lg:text-sm font-semibold uppercase tracking-[0.15em] text-[var(--ink)]/70 group-hover:text-[var(--ink)] text-center transition-colors">
                {/* 표시 전용: slug 형 name 의 하이픈만 공백 처리 (원본 미변경) */}
                {b.name.replace(/-/g, " ")}
              </span>
            )}
            <span className="mt-2 text-[10px] tracking-[0.08em] text-[var(--ink-muted)]/70">
              {b.nameKo ? `${b.nameKo} · ${b.productCount}` : b.productCount}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
