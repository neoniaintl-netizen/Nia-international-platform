import { prisma } from "../db";

// ─── Brand helpers ───

export async function getAllBrands() {
  return prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getBrandBySlug(slug: string) {
  return prisma.brand.findUnique({ where: { slug } });
}

export type MenuCategory = {
  slug: string;
  name: string;
  productCount: number;
  sub: { slug: string; name: string; productCount: number }[];
};

/**
 * CategoryMenu drawer 의 "카테고리" 탭용.
 *
 * 정책:
 *  - 대분류(depth=0): 코드 데이터 5개(CHANNELS) 와 동일 — DB row 없어도 표시
 *  - 하위 카테고리(depth>=1): DB 에 존재 AND ACTIVE 상품 1개 이상만 노출
 *  - 입점 0인 대분류는 sub 빈 배열 (CategoryMenu 가 안내 메시지 노출)
 */
export async function getCategoryMenuTree(): Promise<MenuCategory[]> {
  // 모든 카테고리 + ACTIVE product count
  const cats = await prisma.category.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      depth: true,
      parentId: true,
      sortOrder: true,
      _count: { select: { products: { where: { status: "ACTIVE" } } } },
    },
    orderBy: [{ depth: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  // depth=0 인덱스
  const topBySlug = new Map(cats.filter((c) => c.depth === 0).map((c) => [c.slug, c]));

  // 코드 데이터로 노출 순서/한글명 보장 (CHANNELS 와 동일)
  const TOP_ORDER: { slug: string; name: string }[] = [
    { slug: "golf", name: "골프" },
    { slug: "sports", name: "스포츠" },
    { slug: "outdoor", name: "아웃도어" },
    { slug: "beauty", name: "뷰티" },
    { slug: "women", name: "여성의류" },
  ];

  return TOP_ORDER.map((top) => {
    const topRow = topBySlug.get(top.slug);
    const subs = topRow
      ? cats
          .filter((c) => c.parentId === topRow.id && c._count.products > 0)
          .map((c) => ({
            slug: c.slug,
            name: c.name,
            productCount: c._count.products,
          }))
      : [];
    const total = subs.reduce((a, s) => a + s.productCount, 0);
    return {
      slug: top.slug,
      name: top.name,
      productCount: total,
      sub: subs,
    };
  });
}

export type MenuBrand = {
  name: string;
  nameKo: string | null;
  slug: string;
  productCount: number;
  channel: "apparel" | "shoes" | "beauty";
};

/**
 * CategoryMenu 의 "브랜드" 탭 노출용 brand 목록.
 *
 * - 입점 brand = `isActive: true` AND ACTIVE 상품 1개 이상
 * - 자동 분류: ACTIVE 상품의 카테고리 slug 패턴으로 channel 결정
 *   - `beauty-*` 50% 이상 → beauty
 *   - `*-shoes` 50% 이상 → shoes
 *   - 그 외 → apparel
 */
export async function getBrandsForMenu(): Promise<MenuBrand[]> {
  const brands = await prisma.brand.findMany({
    where: {
      isActive: true,
      products: { some: { status: "ACTIVE" } },
    },
    include: {
      _count: { select: { products: { where: { status: "ACTIVE" } } } },
      products: {
        where: { status: "ACTIVE" },
        select: { category: { select: { slug: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return brands.map((b) => {
    const slugs = b.products.map((p) => p.category.slug);
    const total = slugs.length || 1;
    const shoeRatio = slugs.filter((s) => s.endsWith("-shoes")).length / total;
    const beautyRatio =
      slugs.filter((s) => s.startsWith("beauty-")).length / total;
    const channel: MenuBrand["channel"] =
      beautyRatio >= 0.5 ? "beauty" : shoeRatio >= 0.5 ? "shoes" : "apparel";
    return {
      name: b.name,
      nameKo: b.nameKo,
      slug: b.slug,
      productCount: b._count.products,
      channel,
    };
  });
}

// ─── Category helpers ───

export async function getTopCategories() {
  return prisma.category.findMany({
    where: { depth: 0 },
    orderBy: { sortOrder: "asc" },
    include: { children: { orderBy: { sortOrder: "asc" } } },
  });
}

// ─── Featured brands for home ───

export async function getFeaturedBrands(limit = 6) {
  return prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { followerCount: "desc" },
    take: limit,
  });
}
