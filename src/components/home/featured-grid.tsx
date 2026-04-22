import { ProductCard, type ProductCardData } from "@/components/product/product-card";
import { SectionHeader } from "@/components/home/section-header";

interface FeaturedGridProps {
  products: ProductCardData[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  linkHref?: string;
  linkLabel?: string;
  columns?: 3 | 4;
}

/**
 * G/FORE 스타일 대형 상품 그리드 — 12~16개 상품 한 번에 노출
 * 홈페이지 메인 상품 쇼케이스용.
 */
export function FeaturedGrid({
  products,
  eyebrow = "What's New",
  title = "New Arrivals",
  subtitle,
  linkHref = "/products?sort=newest",
  linkLabel = "Shop All",
  columns = 4,
}: FeaturedGridProps) {
  const gridCols =
    columns === 3
      ? "grid-cols-2 sm:grid-cols-3"
      : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";

  return (
    <section className="py-10 lg:py-16">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          linkHref={linkHref}
          linkLabel={linkLabel}
        />
        <div className={`grid ${gridCols} gap-x-4 gap-y-12`}>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
