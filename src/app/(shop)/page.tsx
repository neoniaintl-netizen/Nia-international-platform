import { HeroBanner } from "@/components/home/hero-banner";
import { CategoryGrid } from "@/components/home/category-grid";
import { ProductRail } from "@/components/home/product-rail";
import { TabbedProductGrid, type ProductTab } from "@/components/home/tabbed-product-grid";
import { BrandLineupCards } from "@/components/home/brand-lineup-cards";
import { BrandSpotlightBanner } from "@/components/home/brand-spotlight-banner";
import { BrandTicker } from "@/components/home/brand-ticker";
import { BrandGrid } from "@/components/home/brand-grid";
import {
  getSaleRankedProducts,
  getChannelNewProducts,
  getGolfSubcategoryTabs,
  getCategoryNewProducts,
  getBrandLineup,
  getBrandsForGrid,
  getBrandFocusProducts,
} from "@/lib/queries";
import { toProductCard } from "@/lib/mappers";
import { SPOTLIGHT_BRAND_SLUG } from "@/lib/home-config";
import { CHANNELS } from "@/lib/constants";

/**
 * 홈 v2 (더카트 실측 기반 리디자인 — docs/home-redesign-design.md §4 참조)
 *
 * 1 GNB(레이아웃) · 2 히어로 · 3 카테고리 · 4 특가 · 5 브랜드 라인업
 * · 6 스포트라이트 · 7 NEW 랭킹 · 8 시즌 아이템 · 9 브랜드 티커
 * · 10 취급 브랜드 · 11 푸터(레이아웃)
 * 모든 상품 쿼리는 status=ACTIVE 가드로 DRAFT 노출 차단.
 */
export default async function HomePage() {
  const [sale, lineup, spotlightProducts, seasonTabs, brandsGrid] =
    await Promise.all([
      getSaleRankedProducts(20), // §4 할인율 내림차순
      getBrandLineup(6), // §5
      getBrandFocusProducts(SPOTLIGHT_BRAND_SLUG, 15), // §6
      getGolfSubcategoryTabs(6), // §8 탭 목록
      getBrandsForGrid(), // §10
    ]);

  // §7 지금 주목할 아이템 — 탭=전체+채널, 데이터=최신 등록순(NEW 기준, 판매랭킹 아님)
  const newTabDefs = [
    { key: "all", label: "전체", slug: null as string | null },
    ...CHANNELS.map((c) => ({ key: c.slug, label: c.displayName, slug: c.slug as string | null })),
  ];
  const newTabProducts = await Promise.all(
    newTabDefs.map((t) => getChannelNewProducts(t.slug, 20))
  );
  const newTabs: ProductTab[] = newTabDefs.map((t, i) => ({
    key: t.key,
    label: t.label,
    products: newTabProducts[i].map(toProductCard),
  }));

  // §8 시즌 아이템 — 탭=골프 하위 카테고리
  const seasonProducts = await Promise.all(
    seasonTabs.map((t) => getCategoryNewProducts(t.slug, 10))
  );
  const seasonTabsData: ProductTab[] = seasonTabs.map((t, i) => ({
    key: t.slug,
    label: t.name.replace(/^골프\s*/, ""),
    products: seasonProducts[i].map(toProductCard),
  }));

  const spotlightBrandName =
    spotlightProducts[0]?.brand?.nameKo ??
    spotlightProducts[0]?.brand?.name ??
    "";

  return (
    <div>
      {/* 2) 히어로 캐러셀 */}
      <HeroBanner />

      {/* 3) 카테고리 그리드 */}
      <CategoryGrid />

      {/* 4) 놓칠 수 없는 특가 */}
      <ProductRail
        eyebrow="Special Price"
        title="놓칠 수 없는 특가"
        subtitle="지금 할인율이 가장 큰 상품"
        linkHref="/products?sort=sale"
        linkLabel="View All"
        products={sale.map(toProductCard)}
      />

      {/* 5) 주목할 브랜드 라인업 */}
      <BrandLineupCards brands={lineup} />

      {/* 6) 브랜드 스포트라이트 — home-config.ts 로 피처 브랜드 교체 */}
      <BrandSpotlightBanner
        brandName={spotlightBrandName}
        brandSlug={SPOTLIGHT_BRAND_SLUG}
        products={spotlightProducts.map(toProductCard)}
      />

      {/* 7) 지금 주목할 아이템 — NEW 기준(판매랭킹 아님), 1~20 넘버링 */}
      <TabbedProductGrid
        eyebrow="What's Hot"
        title="지금 주목할 아이템"
        subtitle="최신 등록순 NEW 랭킹"
        linkHref="/products?sort=newest"
        linkLabel="View All"
        tabs={newTabs}
        numbered
        columns={5}
      />

      {/* 8) 시즌 아이템 — 골프 하위 카테고리 탭 */}
      <TabbedProductGrid
        eyebrow="Season Items"
        title="한눈에 보는 시즌 아이템"
        subtitle="카테고리별 신상 셀렉션"
        linkHref="/category/golf"
        linkLabel="View Golf"
        tabs={seasonTabsData}
        columns={5}
      />

      {/* 9) 브랜드 티커 — 라인 배너 */}
      <BrandTicker />

      {/* 10) 취급 브랜드 그리드 */}
      <BrandGrid brands={brandsGrid} />
    </div>
  );
}
