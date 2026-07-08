import Link from "next/link";
import { getTopCategories } from "@/lib/queries";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import {
  Shirt,
  Wind,
  Footprints,
  Watch,
  Gem,
  Glasses,
  ShoppingBag,
  ChevronRight,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const ICONS: Record<string, any> = {
  tops: Shirt,
  outer: Wind,
  pants: Shirt,
  shoes: Footprints,
  bags: ShoppingBag,
  watches: Watch,
  jewelry: Gem,
  accessories: Glasses,
};

export default async function CategoryIndexPage() {
  const categories = await getTopCategories();
  const tc = await getTranslations("Category");
  const catL = (s: string, n: string) => (tc.has(s) ? tc(s) : n);

  // 카테고리별 상품 수 조회
  const counts = await prisma.product.groupBy({
    by: ["categoryId"],
    where: { status: "ACTIVE" },
    _count: { id: true },
  });
  const countMap = new Map(counts.map((c) => [c.categoryId, c._count.id]));

  // 카테고리 + 하위 카테고리 ID 합산 함수
  function getCategoryCount(cat: (typeof categories)[0]) {
    let total = countMap.get(cat.id) ?? 0;
    for (const child of cat.children) {
      total += countMap.get(child.id) ?? 0;
    }
    return total;
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
        <Link href="/" className="hover:text-black">
          홈
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-black font-medium">카테고리</span>
      </div>

      <h1 className="text-2xl font-bold mb-8">카테고리</h1>

      {/* 아이콘 그리드 */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4 mb-10">
        {categories.map((cat) => {
          const Icon = ICONS[cat.slug] ?? Shirt;
          return (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                <Icon className="w-6 h-6 text-gray-600" strokeWidth={1.5} />
              </div>
              <span className="text-xs text-gray-600 group-hover:text-black transition-colors text-center">
                {catL(cat.slug, cat.name)}
              </span>
            </Link>
          );
        })}
      </div>

      <Separator className="mb-8" />

      {/* 전체 카테고리 리스트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const Icon = ICONS[cat.slug] ?? Shirt;
          const total = getCategoryCount(cat);
          return (
            <div
              key={cat.id}
              className="border rounded-xl p-5 hover:border-black transition-colors"
            >
              {/* 카테고리 헤더 */}
              <Link
                href={`/category/${cat.slug}`}
                className="flex items-center justify-between mb-4 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                    <Icon
                      className="w-5 h-5 text-gray-600"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div>
                    <h2 className="font-bold group-hover:underline">
                      {catL(cat.slug, cat.name)}
                    </h2>
                    <p className="text-xs text-gray-400">{total}개 상품</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-black" />
              </Link>

              {/* 하위 카테고리 */}
              {cat.children.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {cat.children.map((child) => (
                    <Link
                      key={child.slug}
                      href={`/category/${child.slug}`}
                      className="text-xs text-gray-500 hover:text-black bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors"
                    >
                      {catL(child.slug, child.name)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
