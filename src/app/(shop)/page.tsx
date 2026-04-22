import { HeroBanner } from "@/components/home/hero-banner";
import { BrandTicker } from "@/components/home/brand-ticker";
import { FeaturedGrid } from "@/components/home/featured-grid";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { GiftsCallout } from "@/components/home/gifts-callout";
import { BrandStatement } from "@/components/home/brand-statement";
import { BrandSpotlight } from "@/components/home/brand-spotlight";
import {
  getActiveBanners,
  getRankedProducts,
  getSaleProducts,
  getNewProducts,
  getFeaturedBrands,
} from "@/lib/queries";
import { toProductCard } from "@/lib/mappers";

export default async function HomePage() {
  const [banners, ranked, sale, newProducts, brands] = await Promise.all([
    getActiveBanners(),
    getRankedProducts(8),
    getSaleProducts(8),
    getNewProducts(16),
    getFeaturedBrands(6),
  ]);

  // What's New: 신상 + 랭킹 병합 최대 16개 (중복 제거)
  const whatsNew = [...newProducts];
  for (const r of ranked) {
    if (!whatsNew.some((p) => p.id === r.id) && whatsNew.length < 16) {
      whatsNew.push(r);
    }
  }

  return (
    <div>
      {/* 1) Hero — 풀블리드 다크 배너 + 숫자 인디케이터 */}
      <HeroBanner
        banners={
          banners.length > 0
            ? banners.map((b) => ({
                id: b.id,
                title: b.title,
                subtitle: b.subtitle ?? "",
                imageUrl: b.imageUrl,
                imageAlignment:
                  ((b as any).imageAlignment as "left" | "right" | undefined) ??
                  "left",
                linkUrl: b.linkUrl ?? "/",
              }))
            : undefined
        }
      />

      {/* 2) 입점 브랜드 티커 — 자동 스크롤 (Hero 바로 아래) */}
      <BrandTicker />

      {/* 3) What's New — 16개 상품 그리드 */}
      <FeaturedGrid
        eyebrow="What's New"
        title="New Arrivals"
        subtitle="가장 먼저 만나는 신상품 컬렉션"
        linkHref="/products?sort=newest"
        linkLabel="Shop All"
        products={whatsNew.slice(0, 16).map(toProductCard)}
      />

      {/* 3) 2x2 카테고리 쇼케이스 */}
      <CategoryShowcase />

      {/* 4) Time Sale */}
      {sale.length > 0 && (
        <FeaturedGrid
          eyebrow="Limited · Up to 70% Off"
          title="Time Sale"
          subtitle="한정 특가 · 곧 종료"
          linkHref="/products?sort=sale"
          linkLabel="Shop Sale"
          columns={4}
          products={sale.map(toProductCard).slice(0, 8)}
        />
      )}

      {/* 5) GIFTS 2-card */}
      <GiftsCallout />

      {/* 6) Brand Statement — Membership & Stores */}
      <BrandStatement />

      {/* 7) Featured Brands (유지, 하단) */}
      <BrandSpotlight
        brands={brands.map((b) => ({
          name: b.name,
          nameKo: b.nameKo ?? b.name,
          slug: b.slug,
          logoUrl: b.logoUrl,
          followerCount: b.followerCount,
        }))}
      />
    </div>
  );
}
