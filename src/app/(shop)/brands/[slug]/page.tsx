import { ProductCard } from "@/components/product/product-card";
import { Pagination } from "@/components/product/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, Share2 } from "lucide-react";
import { notFound } from "next/navigation";
import { getBrandBySlug, getAllProducts } from "@/lib/queries";
import { toProductCard } from "@/lib/mappers";
import { SortTabs } from "@/components/product/sort-tabs";
import { Suspense } from "react";

const PAGE_SIZE = 20;

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const { slug } = await params;
  const { sort, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const brand = await getBrandBySlug(slug);

  if (!brand) return notFound();

  const { products, total } = await getAllProducts({
    brandSlug: slug,
    sort: sort ?? "popular",
    limit: PAGE_SIZE,
    offset,
  });

  return (
    <div>
      {/* Brand header */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-10 md:py-16">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-4xl font-black">{brand.name}</h1>
              {brand.nameKo && (
                <p className="text-white/60 mt-2 text-sm md:text-base">{brand.nameKo}</p>
              )}
              {brand.description && (
                <p className="text-white/40 text-xs md:text-sm mt-3 max-w-lg">
                  {brand.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-4">
                <Badge variant="outline" className="text-white/60 border-white/20 text-xs">
                  팔로워 {(brand.followerCount / 10000).toFixed(1)}만
                </Badge>
                <Badge variant="outline" className="text-white/60 border-white/20 text-xs">
                  상품 {total.toLocaleString()}개
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="border-white/20 text-white hover:bg-white/10">
                <Heart className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="border-white/20 text-white hover:bg-white/10">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            총 <span className="font-bold text-black">{total}</span>개
          </p>
          <Suspense>
            <SortTabs />
          </Suspense>
        </div>
        <Separator className="mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={toProductCard(product)} />
          ))}
        </div>
        {products.length === 0 && (
          <div className="text-center py-20 text-gray-400 text-sm">
            등록된 상품이 없습니다.
          </div>
        )}

        <Suspense>
          <Pagination total={total} pageSize={PAGE_SIZE} />
        </Suspense>
      </div>
    </div>
  );
}
