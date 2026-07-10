import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ProductCard, type ProductCardData } from "@/components/product/product-card";
import { SPOTLIGHT_BANNER } from "@/lib/home-config";

/**
 * §6 브랜드 스포트라이트 — 더카트 G/FORE 스포트라이트 대응.
 * 풀폭 대형 배너(이미지 없으면 타이포 배너 fallback) + 해당 브랜드 상품 가로 레일.
 * 피처 브랜드는 home-config.ts 의 SPOTLIGHT_BRAND_SLUG 로 교체.
 */
export function BrandSpotlightBanner({
  brandName,
  brandSlug,
  products,
}: {
  brandName: string;
  brandSlug: string;
  products: ProductCardData[];
}) {
  if (products.length === 0) return null;
  const banner = SPOTLIGHT_BANNER;

  return (
    <section className="py-12 lg:py-20 bg-[var(--stone)] border-y border-[var(--line)]">
      {/* 대형 배너 */}
      <Link href={`/brands/${brandSlug}`} className="group block">
        {banner.imageUrl ? (
          <div className="relative aspect-[16/7] md:aspect-[21/7] max-h-[480px] overflow-hidden bg-[var(--ink)]">
            <Image
              src={banner.imageUrl}
              alt={brandName}
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 max-w-[1360px] mx-auto px-4 lg:px-8 pb-8 lg:pb-12 text-white">
              <p className="eyebrow text-white/60 mb-2">Brand Spotlight</p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.02em] uppercase">
                {banner.title}
              </h2>
              <p className="text-sm text-white/70 mt-2">{banner.subtitle}</p>
            </div>
          </div>
        ) : (
          /* 이미지 자산 없을 때 — 무채색 대형 타이포 배너 */
          <div className="max-w-[1360px] mx-auto px-4 lg:px-8">
            <div className="border-y-2 border-[var(--ink)] py-10 lg:py-16 mb-10 lg:mb-14">
              <p className="eyebrow text-[var(--ink-muted)] mb-3">
                Brand Spotlight
              </p>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-[-0.02em] uppercase text-[var(--ink)] leading-[0.95]">
                  {banner.title}
                </h2>
                <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--ink)] pb-1 border-b border-[var(--ink)] group-hover:gap-3.5 transition-all">
                  View Brand
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </span>
              </div>
              <p className="text-[13px] text-[var(--ink-muted)] mt-4">
                {banner.subtitle}
              </p>
            </div>
          </div>
        )}
      </Link>

      {/* 브랜드 상품 레일 */}
      <div className="max-w-[1360px] mx-auto px-4 lg:px-8">
        <div className="-mx-4 px-4 lg:mx-0 lg:px-0">
          <div className="flex gap-3 sm:gap-4 lg:gap-5 overflow-x-auto snap-x snap-mandatory pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {products.map((p) => (
              <div
                key={p.id}
                className="snap-start shrink-0 w-[44vw] sm:w-[240px] lg:w-[262px]"
              >
                <ProductCard product={p} />
              </div>
            ))}
            <div className="shrink-0 w-1 lg:hidden" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
