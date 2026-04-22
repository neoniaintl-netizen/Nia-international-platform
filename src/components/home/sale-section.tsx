import { ProductCard, type ProductCardData } from "@/components/product/product-card";
import { SectionHeader } from "@/components/home/section-header";

interface SaleSectionProps {
  products: ProductCardData[];
}

export function SaleSection({ products }: SaleSectionProps) {
  return (
    <section className="py-10 lg:py-20 bg-[var(--paper)]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
        <SectionHeader
          eyebrow="Limited Offer · Up to 70% Off"
          title="Time Sale"
          subtitle="오늘만의 한정 특가"
          linkHref="/products?sort=sale"
          linkLabel="Shop All"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-10">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
