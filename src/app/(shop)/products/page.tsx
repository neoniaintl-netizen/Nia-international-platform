import { ProductCard } from "@/components/product/product-card";
import { Pagination } from "@/components/product/pagination";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getAllProducts, getTopCategories } from "@/lib/queries";
import { toProductCard } from "@/lib/mappers";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params.page) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const t = await getTranslations("Shop");
  const [{ products, total }, categories] = await Promise.all([
    getAllProducts({
      categorySlug: params.category,
      search: params.q,
      sort: params.sort,
      limit: PAGE_SIZE,
      offset,
    }),
    getTopCategories(),
  ]);

  const SORT_OPTIONS = [
    { label: t("sortPopular"), value: "popular" },
    { label: t("sortNewest"), value: "newest" },
    { label: t("sortPriceAsc"), value: "price_asc" },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      {/* Category Filters */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        <a href="/products">
          <Badge
            variant={!params.category ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs rounded-full"
          >
            {t("all")}
          </Badge>
        </a>
        {categories.map((cat) => (
          <a key={cat.slug} href={`/products?category=${cat.slug}`}>
            <Badge
              variant={params.category === cat.slug ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs rounded-full"
            >
              {cat.name}
            </Badge>
          </a>
        ))}
      </div>

      {/* Sort & Count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          {t("totalItems", { n: total })}
        </p>
        <div className="flex items-center gap-3">
          {SORT_OPTIONS.map((opt) => (
            <a
              key={opt.value}
              href={`/products?${new URLSearchParams({
                ...(params.category ? { category: params.category } : {}),
                ...(params.q ? { q: params.q } : {}),
                sort: opt.value,
              }).toString()}`}
              className={`text-xs ${
                (params.sort ?? "popular") === opt.value
                  ? "font-bold text-black"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {opt.label}
            </a>
          ))}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={toProductCard(product)} />
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">{t("noProducts")}</p>
          <p className="text-sm">{t("noProductsHint")}</p>
        </div>
      )}

      {/* 페이지네이션 */}
      <Suspense>
        <Pagination total={total} pageSize={PAGE_SIZE} />
      </Suspense>
    </div>
  );
}
