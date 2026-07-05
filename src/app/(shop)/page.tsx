import { getTranslations } from "next-intl/server";
import { HeroBanner } from "@/components/home/hero-banner";
import { BrandTicker } from "@/components/home/brand-ticker";
import { FeaturedGrid } from "@/components/home/featured-grid";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { SpringCollection } from "@/components/home/spring-collection";
import { BrandStatement } from "@/components/home/brand-statement";
import { BrandSpotlight } from "@/components/home/brand-spotlight";
import {
  getRankedProducts,
  getSaleProducts,
  getNewProducts,
  getGolfProducts,
  getBrandFocusProducts,
  pickBrandFocusSlug,
} from "@/lib/queries";
import { toProductCard } from "@/lib/mappers";

export default async function HomePage() {
  const t = await getTranslations("Home");
  const [ranked, sale, newProducts, golf, focusSlug] = await Promise.all([
    getRankedProducts(8),
    getSaleProducts(8),
    getNewProducts(16),
    getGolfProducts(8),
    pickBrandFocusSlug(), // 골프 카테고리 ACTIVE 상품 가장 많은 brand
  ]);

  // Brand Focus — 자동 선택된 brand의 최신 4개. brand 없으면 빈 배열 → 섹션 숨김.
  const brandFocus = focusSlug
    ? await getBrandFocusProducts(focusSlug, 4)
    : [];
  const brandFocusName =
    brandFocus[0]?.brand?.nameKo ?? brandFocus[0]?.brand?.name ?? "";

  // What's New: 신상 + 랭킹 병합 최대 16개 (중복 제거)
  const whatsNew = [...newProducts];
  for (const r of ranked) {
    if (!whatsNew.some((p) => p.id === r.id) && whatsNew.length < 16) {
      whatsNew.push(r);
    }
  }

  return (
    <div>
      {/* 1) Hero — 코드 데이터(`src/lib/hero-banners.ts`) 기준 노출. 운영자 어드민 배너 등록 흐름 사용 시 props로 전달 */}
      <HeroBanner />

      {/* 2) 입점 브랜드 티커 — 자동 스크롤 (Hero 바로 아래) */}
      <BrandTicker />

      {/* 3) What's New — 16개 상품 그리드 */}
      <FeaturedGrid
        eyebrow="What's New"
        title="New Arrivals"
        subtitle={t("newArrivalsSubtitle")}
        linkHref="/products?sort=newest"
        linkLabel="Shop All"
        products={whatsNew.slice(0, 16).map(toProductCard)}
      />

      {/* 4) Golf Select — 골프 카테고리 ACTIVE 상품 (DRAFT 자동 제외) */}
      {golf.length > 0 && (
        <FeaturedGrid
          eyebrow="Golf Select"
          title="Golf Select"
          subtitle={t("golfSelectSubtitle")}
          linkHref="/category/golf"
          linkLabel="View Golf"
          columns={4}
          products={golf.map(toProductCard)}
        />
      )}

      {/* 5) 2x2 카테고리 쇼케이스 */}
      <CategoryShowcase />

      {/* 6) Time Sale — 한정 특가 기획전 */}
      {sale.length > 0 && (
        <FeaturedGrid
          eyebrow="Limited Offer"
          title="Time Sale"
          subtitle={t("timeSaleSubtitle")}
          linkHref="/products?sort=sale"
          linkLabel="View Sale"
          columns={4}
          products={sale.map(toProductCard).slice(0, 8)}
        />
      )}

      {/* 7) Brand Focus — 골프 카테고리 ACTIVE 상품 가장 많은 brand 클로즈업 */}
      {brandFocus.length > 0 && focusSlug && (
        <FeaturedGrid
          eyebrow="Brand in Focus"
          title={brandFocusName || "Featured Brand"}
          subtitle={t("brandFocusSubtitle")}
          linkHref={`/brands/${focusSlug}`}
          linkLabel="View Brand"
          columns={4}
          products={brandFocus.map(toProductCard)}
        />
      )}

      {/* 8) Season Collection — 시즌 코디 추천 자동 슬라이드 (현재 Summer Edit, 문구는 spring-collection.tsx 기본값) */}
      <SpringCollection
        products={whatsNew.slice(0, 12).map(toProductCard)}
      />

      {/* 6) Brand Statement — Membership & Stores */}
      <BrandStatement />

      {/* 7) Featured Brands — 큐레이션 데이터 컴포넌트 내부 DEFAULT_FEATURED 사용 */}
      <BrandSpotlight />
    </div>
  );
}
