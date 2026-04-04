"use client";

import { ProductCard, type ProductCardData } from "@/components/product/product-card";

interface WishlistProduct extends ProductCardData {
  productId: string;
}

export function WishlistGrid({ products }: { products: WishlistProduct[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-6">
      {products.map((product) => (
        <ProductCard key={product.productId} product={product} wishlisted />
      ))}
    </div>
  );
}
