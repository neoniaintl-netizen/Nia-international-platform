import { ProductCard, type ProductCardData } from "@/components/product/product-card";
import { SectionHeader } from "@/components/home/section-header";

interface NewArrivalsProps {
  products: ProductCardData[];
}

export function NewArrivals({ products }: NewArrivalsProps) {
  return (
    <section className="py-10 lg:py-20">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
        <SectionHeader
          eyebrow="Just In"
          title="New Arrivals"
          subtitle="가장 먼저 만나는 신상품"
          linkHref="/products?sort=newest"
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
