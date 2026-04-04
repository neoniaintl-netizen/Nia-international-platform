import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/product/product-card";
import { getAllProducts } from "@/lib/queries";
import { toProductCard } from "@/lib/mappers";
import { SearchFilters } from "@/components/search/search-filters";
import Link from "next/link";

const POPULAR_KEYWORDS = ["반팔 티셔츠", "와이드 데님", "스니커즈", "가디건", "메신저백", "슬랙스", "버킷햇", "후드"];

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; minPrice?: string; maxPrice?: string; sizes?: string; colors?: string }> }) {
  const { q, minPrice, maxPrice, sizes, colors } = await searchParams;

  const hasFilters = !!(minPrice || maxPrice || sizes || colors);
  const results = (q || hasFilters) ? await getAllProducts({
    search: q,
    minPrice: minPrice ? parseInt(minPrice) : undefined,
    maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
    sizes: sizes ? sizes.split(",").filter(Boolean) : undefined,
    colors: colors ? colors.split(",").filter(Boolean) : undefined,
  }) : null;

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      {/* Search input */}
      <form className="relative max-w-2xl mx-auto mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          name="q"
          placeholder="브랜드, 상품, 스타일 검색"
          defaultValue={q}
          className="pl-12 h-12 text-base bg-gray-50 border-gray-200 rounded-xl"
        />
      </form>

      {!q && !hasFilters ? (
        /* Default: popular keywords */
        <div className="max-w-2xl mx-auto">
          <h2 className="text-sm font-bold mb-4">인기 검색어</h2>
          <div className="flex flex-wrap gap-2">
            {POPULAR_KEYWORDS.map((keyword, i) => (
              <Link key={keyword} href={`/search?q=${encodeURIComponent(keyword)}`}>
                <Badge
                  variant="outline"
                  className="cursor-pointer px-3 py-1.5 text-sm rounded-full hover:bg-gray-50"
                >
                  <span className="text-[var(--sale)] font-bold mr-1.5">{i + 1}</span>
                  {keyword}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        /* Search results with filter sidebar */
        <div className="flex gap-8">
          {/* Filter sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <SearchFilters />
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500 mb-6">
              {q && (
                <><span className="font-bold text-black">&quot;{q}&quot;</span>{" "}</>
              )}
              검색 결과{" "}
              <span className="font-bold text-black">{results?.total ?? 0}</span>개
              {hasFilters && <span className="text-gray-400 ml-2">(필터 적용됨)</span>}
            </p>
            <Separator className="mb-6" />

            {/* Mobile filter toggle */}
            <div className="lg:hidden mb-6">
              <details className="border rounded-xl">
                <summary className="px-4 py-3 text-sm font-medium cursor-pointer">필터 설정</summary>
                <div className="px-4 pb-4">
                  <SearchFilters />
                </div>
              </details>
            </div>

            {results && results.products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-6">
                {results.products.map((product) => (
                  <ProductCard key={product.id} product={toProductCard(product)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400">
                <p className="text-lg mb-2">검색 결과가 없습니다</p>
                <p className="text-sm">다른 키워드로 검색해보세요.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
