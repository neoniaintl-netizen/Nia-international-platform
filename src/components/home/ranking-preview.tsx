import { ProductCard, type ProductCardData } from "@/components/product/product-card";
import { SectionHeader } from "@/components/home/section-header";

interface RankingPreviewProps {
  products: ProductCardData[];
}

export function RankingPreview({ products }: RankingPreviewProps) {
  return (
    <section className="py-14 lg:py-20">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
        <SectionHeader
          eyebrow="Curated Rankings"
          title="실시간 랭킹"
          subtitle="Trending Now"
          linkHref="/ranking"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-10">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} rank={index + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
