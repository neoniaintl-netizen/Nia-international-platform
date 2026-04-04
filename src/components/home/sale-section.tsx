import Link from "next/link";
import { ChevronRight, Flame } from "lucide-react";
import { ProductCard, type ProductCardData } from "@/components/product/product-card";

interface SaleSectionProps {
  products: ProductCardData[];
}

export function SaleSection({ products }: SaleSectionProps) {
  return (
    <section className="py-8 bg-gray-50">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[var(--sale)]" />
            <h2 className="text-lg font-bold">타임 세일</h2>
            <span className="text-sm text-[var(--sale)] font-medium">최대 70%</span>
          </div>
          <Link
            href="/products?sort=sale"
            className="text-xs text-gray-400 flex items-center gap-0.5 hover:text-black transition-colors"
          >
            전체보기
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
