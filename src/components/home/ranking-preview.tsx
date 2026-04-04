import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductCard, type ProductCardData } from "@/components/product/product-card";

interface RankingPreviewProps {
  products: ProductCardData[];
}

export function RankingPreview({ products }: RankingPreviewProps) {
  return (
    <section className="py-8">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">실시간 랭킹</h2>
          <Link
            href="/ranking"
            className="text-xs text-gray-400 flex items-center gap-0.5 hover:text-black transition-colors"
          >
            더보기
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-6">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} rank={index + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
