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
import { getTranslations } from "next-intl/server";

/** 브랜드 라운드로빈 인터리브 — 최신순 리스트에서 한 브랜드 연속 도배 방지 */
function interleaveByBrand<T extends { brandId: string }>(
  products: T[],
  limit: number
): T[] {
  const byBrand = new Map<string, T[]>();
  for (const p of products) {
    const arr = byBrand.get(p.brandId) ?? [];
    arr.push(p);
    byBrand.set(p.brandId, arr);
  }
  const queues = [...byBrand.values()];
  const out: T[] = [];
  let added = true;
  while (out.length < limit && added) {
    added = false;
    for (const q of queues) {
      const item = q.shift();
      if (item) {
        out.push(item);
        added = true;
        if (out.length >= limit) break;
      }
    }
  }
  return out;
}

/**
 * 홈 v2 (더카트 실측 기반 리디자인 — docs/home-redesign-design.md §4 참조)
 *
 * 1 GNB(레이아웃) · 2 히어로 · 3 카테고리 · 4 특가 · 5 브랜드 라인업
 * · 6 스포트라이트 · 7 NEW 랭킹 · 8 시즌 아이템 · 9 브랜드 티커
 * · 10 취급 브랜드 · 11 푸터(레이아웃)
 * 모든 상품 쿼리는 status=ACTIVE 가드로 DRAFT 노출 차단.
 */
export default async function HomePage() {
  const [t, tCh, tCat, sale, lineup, spotlightProducts, seasonTabs, brandsGrid] =
    await Promise.all([
      getTranslations("Home"),
      getTranslations("Channel"),
      getTranslations("Category"),
      getSaleRankedProducts(20), // §4 할인율 내림차순
      getBrandLineup(6), // §5
      getBrandFocusProducts(SPOTLIGHT_BRAND_SLUG, 15), // §6
      getGolfSubcategoryTabs(6), // §8 탭 목록
      getBrandsForGrid(), // §10
    ]);

  // §7 지금 주목할 아이템 — 탭=전체+채널, 데이터=최신 등록순(NEW 기준, 판매랭킹 아님).
  // 최신순은 직전 크롤 브랜드가 몰아서 나오므로, 넉넉한 풀(60)을 브랜드 라운드로빈으로
  // 인터리브해 상위 20개만 사용 — 한 브랜드 도배 방지.
  const newTabDefs = [
    { key: "all", label: t("v2TabAll"), slug: null as string | null },
    ...CHANNELS.map((c) => ({ key: c.slug, label: tCh(c.slug), slug: c.slug as string | null })),
  ];
  const newTabProducts = await Promise.all(
    newTabDefs.map((d) => getChannelNewProducts(d.slug, 60))
  );
  const newTabs: ProductTab[] = newTabDefs.map((d, i) => ({
    key: d.key,
    label: d.label,
    products: interleaveByBrand(newTabProducts[i], 20).map(toProductCard),
  }));

  // §8 시즌 아이템 — 탭=골프 하위 카테고리 (라벨은 Category 네임스페이스 번역)
  const seasonProducts = await Promise.all(
    seasonTabs.map((s) => getCategoryNewProducts(s.slug, 10))
  );
  const seasonTabsData: ProductTab[] = seasonTabs.map((s, i) => ({
    key: s.slug,
    label: tCat(s.slug),
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
        title={t("v2SaleTitle")}
        subtitle={t("v2SaleSubtitle")}
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
        title={t("v2HotTitle")}
        subtitle={t("v2HotSubtitle")}
        linkHref="/products?sort=newest"
        linkLabel="View All"
        tabs={newTabs}
        numbered
        columns={5}
        mobileLimit={10}
      />

      {/* 8) 시즌 아이템 — 골프 하위 카테고리 탭 */}
      <TabbedProductGrid
        eyebrow="Season Items"
        title={t("v2SeasonTitle")}
        subtitle={t("v2SeasonSubtitle")}
        linkHref="/category/golf"
        linkLabel="View Golf"
        tabs={seasonTabsData}
        columns={5}
        mobileLimit={6}
      />

      {/* 9) 브랜드 티커 — 라인 배너 */}
      <BrandTicker />

      {/* 10) 취급 브랜드 그리드 */}
      <BrandGrid brands={brandsGrid} />
    </div>
  );
}
