import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getAllBrands } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { BrandSearch } from "@/components/brand/brand-search";
import { AlphaFilter } from "@/components/brand/alpha-filter";
import { Suspense } from "react";

export default async function BrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; letter?: string }>;
}) {
  const { q, letter } = await searchParams;

  const brands = await getAllBrands();

  // Get product count per brand
  const brandProductCounts = await prisma.product.groupBy({
    by: ["brandId"],
    where: { status: "ACTIVE" },
    _count: true,
  });
  const countMap = new Map(brandProductCounts.map((c) => [c.brandId, c._count]));

  // 필터링
  let filtered = brands;

  if (q) {
    const keyword = q.toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.name.toLowerCase().includes(keyword) ||
        (b.nameKo && b.nameKo.toLowerCase().includes(keyword))
    );
  }

  if (letter) {
    if (letter === "인기") {
      filtered = filtered
        .filter((b) => b.followerCount > 100000)
        .sort((a, b) => b.followerCount - a.followerCount);
    } else {
      filtered = filtered.filter((b) =>
        b.name.toUpperCase().startsWith(letter.toUpperCase())
      );
    }
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-2xl font-bold mb-6">브랜드</h1>

      {/* Search */}
      <Suspense>
        <BrandSearch />
      </Suspense>

      {/* Alpha index */}
      <Suspense>
        <AlphaFilter />
      </Suspense>

      {/* Result info */}
      {(q || letter) && (
        <div className="mb-4 text-sm text-gray-500">
          {q && <span>&ldquo;{q}&rdquo; 검색 결과 </span>}
          {letter && !q && <span>{letter} </span>}
          <span className="font-bold text-black">{filtered.length}</span>개 브랜드
        </div>
      )}

      {/* Brand list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((brand) => (
          <Link
            key={brand.slug}
            href={`/brands/${brand.slug}`}
            className="flex items-center justify-between p-4 rounded-xl border hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="font-bold text-sm">{brand.name}</p>
              {brand.nameKo && (
                <p className="text-xs text-gray-400 mt-0.5">{brand.nameKo}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {brand.followerCount > 200000 && (
                <Badge className="bg-red-50 text-[var(--sale)] text-[10px] border-0">
                  인기
                </Badge>
              )}
              <span className="text-xs text-gray-400">
                {(countMap.get(brand.id) ?? 0).toLocaleString()}개
              </span>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">검색 결과가 없습니다</p>
          <p className="text-sm">다른 키워드로 검색해보세요.</p>
        </div>
      )}
    </div>
  );
}
