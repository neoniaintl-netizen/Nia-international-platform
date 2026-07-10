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

// ─── 홈 v2: 브랜드 라인업 / 취급 브랜드 그리드 ───

export type BrandLineupItem = {
  name: string;
  nameKo: string | null;
  slug: string;
  productCount: number;
  /** 카드 비주얼 — coverImageUrl 우선, 없으면(현재 전부 없음) 최신 ACTIVE 상품 메인 이미지 fallback */
  imageUrl: string | null;
};

/**
 * "주목할 브랜드 라인업" (홈 §5) — ACTIVE 상품 수 상위 브랜드 + 대표 이미지.
 * Brand.coverImageUrl 이 채워지면 자동으로 그쪽을 우선 사용.
 */
export async function getBrandLineup(limit = 6): Promise<BrandLineupItem[]> {
  const brands = await prisma.brand.findMany({
    where: { isActive: true, products: { some: { status: "ACTIVE" } } },
    select: {
      name: true,
      nameKo: true,
      slug: true,
      coverImageUrl: true,
      _count: { select: { products: { where: { status: "ACTIVE" } } } },
      products: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { images: { where: { isMain: true }, take: 1, select: { url: true } } },
      },
    },
  });
  return brands
    .sort((a, b) => b._count.products - a._count.products)
    .slice(0, limit)
    .map((b) => ({
      name: b.name,
      nameKo: b.nameKo,
      slug: b.slug,
      productCount: b._count.products,
      imageUrl: b.coverImageUrl ?? b.products[0]?.images[0]?.url ?? null,
    }));
}

export type BrandGridItem = {
  name: string;
  nameKo: string | null;
  slug: string;
  logoUrl: string | null;
  productCount: number;
};

/**
 * "취급 브랜드 그리드" (홈 §10) — 전체 활성 브랜드.
 * ACTIVE 상품 보유 브랜드 우선(상품 수 desc), 그 다음 이름순.
 */
export async function getBrandsForGrid(): Promise<BrandGridItem[]> {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    select: {
      name: true,
      nameKo: true,
      slug: true,
      logoUrl: true,
      _count: { select: { products: { where: { status: "ACTIVE" } } } },
    },
  });
  return brands
    .sort(
      (a, b) =>
        b._count.products - a._count.products || a.name.localeCompare(b.name)
    )
    .map((b) => ({
      name: b.name,
      nameKo: b.nameKo,
      slug: b.slug,
      logoUrl: b.logoUrl,
      productCount: b._count.products,
    }));
}
