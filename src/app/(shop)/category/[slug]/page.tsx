import { ProductCard } from "@/components/product/product-card";
import { Pagination } from "@/components/product/pagination";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAllProducts } from "@/lib/queries";
import { toProductCard } from "@/lib/mappers";
import { SortTabs } from "@/components/product/sort-tabs";
import { Suspense } from "react";

const PAGE_SIZE = 20;

export default async function CategoryPage({
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

  const category = await prisma.category.findUnique({
    where: { slug },
    include: { children: { orderBy: { sortOrder: "asc" } }, parent: true },
  });

  if (!category) return notFound();

  const { products, total } = await getAllProducts({
    categorySlug: slug,
    sort: sort ?? "popular",
    limit: PAGE_SIZE,
    offset,
  });

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
        <Link href="/" className="hover:text-black">홈</Link>
        <ChevronRight className="w-3 h-3" />
        {category.parent && (
          <>
            <Link href={`/category/${category.parent.slug}`} className="hover:text-black">
              {category.parent.name}
            </Link>
            <ChevronRight className="w-3 h-3" />
          </>
        )}
        <span className="text-black font-medium">{category.name}</span>
      </div>

      <h1 className="text-2xl font-bold mb-6">{category.name}</h1>

      {/* Sub-categories */}
      {category.children.length > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Badge variant="default" className="cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs rounded-full">
            전체
          </Badge>
          {category.children.map((child) => (
            <Link key={child.slug} href={`/category/${child.slug}`}>
              <Badge
                variant="outline"
                className="cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs rounded-full"
              >
                {child.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}

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
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">상품이 없습니다</p>
          <p className="text-sm">다른 카테고리를 선택해보세요.</p>
        </div>
      )}

      <Suspense>
        <Pagination total={total} pageSize={PAGE_SIZE} />
      </Suspense>
    </div>
  );
}
