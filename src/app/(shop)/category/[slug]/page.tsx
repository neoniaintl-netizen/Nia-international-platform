import { ProductCard } from "@/components/product/product-card";
import { Pagination } from "@/components/product/pagination";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { getAllProducts } from "@/lib/queries";
import { toProductCard } from "@/lib/mappers";
import { SortTabs } from "@/components/product/sort-tabs";
import { Suspense } from "react";

const PAGE_SIZE = 20;

/**
 * 상단 메뉴(`CHANNELS`)에 노출되는 known category slug 화이트리스트.
 * DB Category row가 없어도 404 대신 빈 상태 페이지를 렌더한다.
 * 운영자가 `/api/admin/setup-categories` 등을 호출해 실제 DB row를 만들면
 * findUnique 가 우선 매칭되어 children/parent 트리도 노출된다.
 */
const KNOWN_CATEGORIES: Record<string, { nameKo: string }> = {
  golf: { nameKo: "골프" },
  sports: { nameKo: "스포츠" },
  outdoor: { nameKo: "아웃도어" },
  beauty: { nameKo: "뷰티" },
  women: { nameKo: "여성의류" },
  men: { nameKo: "남성의류" },
};

type CategoryView = {
  id: string;
  slug: string;
  name: string;
  children: { slug: string; name: string }[];
  parent: { slug: string; name: string } | null;
};

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

  const dbCategory = await prisma.category.findUnique({
    where: { slug },
    include: { children: { orderBy: { sortOrder: "asc" } }, parent: true },
  });

  let category: CategoryView;
  if (dbCategory) {
    category = {
      id: dbCategory.id,
      slug: dbCategory.slug,
      name: dbCategory.name,
      children: dbCategory.children.map((c) => ({ slug: c.slug, name: c.name })),
      parent: dbCategory.parent
        ? { slug: dbCategory.parent.slug, name: dbCategory.parent.name }
        : null,
    };
  } else {
    const known = KNOWN_CATEGORIES[slug];
    if (!known) return notFound();
    category = {
      id: `_known_${slug}`,
      slug,
      name: known.nameKo,
      children: [],
      parent: null,
    };
  }

  const { products, total } = await getAllProducts({
    categorySlug: slug,
    sort: sort ?? "popular",
    limit: PAGE_SIZE,
    offset,
  });

  // 카테고리명 다국어 (slug 키 있으면 번역, 없으면 DB명)
  const tc = await getTranslations("Category");
  const catL = (s: string, n: string) => (tc.has(s) ? tc(s) : n);

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
        <Link href="/" className="hover:text-black">홈</Link>
        <ChevronRight className="w-3 h-3" />
        {category.parent && (
          <>
            <Link href={`/category/${category.parent.slug}`} className="hover:text-black">
              {catL(category.parent.slug, category.parent.name)}
            </Link>
            <ChevronRight className="w-3 h-3" />
          </>
        )}
        <span className="text-black font-medium">{catL(category.slug, category.name)}</span>
      </div>

      <h1 className="text-2xl font-bold mb-6">{catL(category.slug, category.name)}</h1>

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
                {catL(child.slug, child.name)}
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
        <div className="text-center py-24 lg:py-32">
          <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--ink-muted)] mb-3">
            Coming Soon
          </p>
          <p className="text-xl lg:text-2xl font-normal tracking-tight text-[var(--ink)] mb-3">
            준비 중인 카테고리입니다
          </p>
          <p className="text-sm text-[var(--ink-muted)]">
            곧 새로운 상품을 만나보실 수 있어요.
          </p>
        </div>
      )}

      <Suspense>
        <Pagination total={total} pageSize={PAGE_SIZE} />
      </Suspense>
    </div>
  );
}
