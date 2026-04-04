import { HeroBanner } from "@/components/home/hero-banner";
import { CategoryNav } from "@/components/home/category-nav";
import { RankingPreview } from "@/components/home/ranking-preview";
import { SaleSection } from "@/components/home/sale-section";
import { BrandSpotlight } from "@/components/home/brand-spotlight";
import { NewArrivals } from "@/components/home/new-arrivals";
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
    getRankedProducts(6),
    getSaleProducts(4),
    getNewProducts(8),
    getFeaturedBrands(6),
  ]);

  return (
    <div>
      <HeroBanner
        banners={banners.length > 0 ? banners.map((b) => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle ?? "",
          imageUrl: b.imageUrl,
          linkUrl: b.linkUrl ?? "/",
        })) : undefined}
      />
      <CategoryNav />
      <RankingPreview products={ranked.map(toProductCard)} />
      <SaleSection products={sale.map(toProductCard)} />
      <BrandSpotlight
        brands={brands.map((b) => ({
          name: b.name,
          nameKo: b.nameKo ?? b.name,
          slug: b.slug,
          logoUrl: b.logoUrl,
          followerCount: b.followerCount,
        }))}
      />
      <NewArrivals products={newProducts.map(toProductCard)} />
    </div>
  );
}
