import { prisma } from "../db";

// ─── Product helpers ───

/**
 * 사용자 화면 노출 가드.
 *
 * 현재는 **DRAFT 차단만** 유지 — `status === "ACTIVE"`.
 * placeholder/Unknown/seed-fallback/이미지 품질 같은 추가 가드는 일시적으로 제거
 * (사용자 화면에서 기존 상품이 사라지는 부작용 → 별도 단계로 미룸).
 *
 * 추후 품질 가드 복원 시: originalPrice>0, brand.name!="Unknown", images.some(url!=placehold)
 * 같은 조건을 단계적으로 추가하고 화면 결과 확인.
 *
 * 관리자 query (getAdminProducts) 와 직접 URL 진입 (getProductBySlug) 에는 적용하지 않음.
 */
const USER_FACING_GUARD = {
  status: "ACTIVE" as const,
};

export async function getRankedProducts(limit = 8) {
  return prisma.product.findMany({
    where: { ...USER_FACING_GUARD, rankPosition: { not: null } },
    orderBy: { rankPosition: "asc" },
    take: limit,
    include: {
      brand: { select: { name: true, slug: true } },
      images: { where: { isMain: true }, take: 1 },
    },
  });
}

export async function getDailyRankedProducts(limit = 8) {
  return prisma.product.findMany({
    where: USER_FACING_GUARD,
    orderBy: { viewCount: "desc" },
    take: limit,
    include: {
      brand: { select: { name: true, slug: true } },
      images: { where: { isMain: true }, take: 1 },
    },
  });
}

export async function getWeeklyRankedProducts(limit = 8) {
  return prisma.product.findMany({
    where: USER_FACING_GUARD,
    orderBy: { reviewCount: "desc" },
    take: limit,
    include: {
      brand: { select: { name: true, slug: true } },
      images: { where: { isMain: true }, take: 1 },
    },
  });
}

export async function getSaleProducts(limit = 4) {
  return prisma.product.findMany({
    where: { ...USER_FACING_GUARD, salePrice: { not: null } },
    orderBy: [{ updatedAt: "desc" }],
    take: limit,
    include: {
      brand: { select: { name: true, slug: true } },
      images: { where: { isMain: true }, take: 1 },
    },
  });
}

/**
 * What's New 섹션 — 골프 브랜드 우선 + 브랜드별 라운드로빈 인터리브.
 *
 * 정책:
 *  1) 골프 카테고리(slug=golf 또는 parent.slug=golf) ACTIVE 상품 보유 brand 식별
 *  2) 각 골프 brand 의 최신 ACTIVE 상품 perBrandCap 개씩 fetch
 *  3) 라운드로빈으로 인터리브 (brand1[0], brand2[0], brand1[1], brand2[1], ...)
 *  4) 부족분은 골프 외 brand 의 최신 상품을 같은 라운드로빈으로 보강
 */
export async function getNewProducts(limit = 8) {
  const include = {
    brand: { select: { name: true, slug: true } },
    images: { where: { isMain: true }, take: 1 },
  };
  const orderBy: Array<Record<string, "asc" | "desc">> = [
    { isNew: "desc" },
    { createdAt: "desc" },
  ];

  // 1) 골프 brand 식별
  const golfBrands = await prisma.brand.findMany({
    where: {
      isActive: true,
      products: {
        some: {
          status: "ACTIVE",
          OR: [
            { category: { slug: "golf" } },
            { category: { parent: { slug: "golf" } } },
          ],
        },
      },
    },
    select: { id: true },
    orderBy: { name: "asc" },
  });

  // 2) 각 골프 brand 의 최신 상품 fetch (per-brand cap → 한 브랜드 독식 방지)
  const golfPerCap = Math.max(
    2,
    Math.ceil(limit / Math.max(golfBrands.length, 1)) + 2,
  );
  const golfByBrand = await Promise.all(
    golfBrands.map((b) =>
      prisma.product.findMany({
        where: { ...USER_FACING_GUARD, brandId: b.id },
        orderBy,
        take: golfPerCap,
        include,
      }),
    ),
  );

  // 3) 라운드로빈 인터리브
  const result: typeof golfByBrand[number] = [];
  for (let i = 0; result.length < limit; i++) {
    let added = false;
    for (const list of golfByBrand) {
      if (i < list.length && result.length < limit) {
        result.push(list[i]);
        added = true;
      }
    }
    if (!added) break;
  }

  // 4) 부족분 — 골프 외 brand 라운드로빈 보강
  if (result.length < limit) {
    const golfBrandIds = new Set(golfBrands.map((b) => b.id));
    const otherBrands = await prisma.brand.findMany({
      where: {
        isActive: true,
        id: { notIn: [...golfBrandIds] },
        products: { some: { status: "ACTIVE" } },
      },
      select: { id: true },
      orderBy: { name: "asc" },
    });
    const otherPerCap = Math.max(
      2,
      Math.ceil((limit - result.length) / Math.max(otherBrands.length, 1)) + 1,
    );
    const otherByBrand = await Promise.all(
      otherBrands.map((b) =>
        prisma.product.findMany({
          where: { ...USER_FACING_GUARD, brandId: b.id },
          orderBy,
          take: otherPerCap,
          include,
        }),
      ),
    );
    for (let j = 0; result.length < limit; j++) {
      let added = false;
      for (const list of otherByBrand) {
        if (j < list.length && result.length < limit) {
          result.push(list[j]);
          added = true;
        }
      }
      if (!added) break;
    }
  }

  return result.slice(0, limit);
}

/**
 * Golf Select 섹션 — 골프 카테고리 ACTIVE 상품.
 * 대분류 "golf" 또는 부모가 "golf" 인 자식 카테고리(상의/하의/모자 등) 모두 매칭.
 * 정렬: isBest desc → rankPosition asc → isNew desc → createdAt desc
 */
export async function getGolfProducts(limit = 8) {
  return prisma.product.findMany({
    where: {
      ...USER_FACING_GUARD,
      OR: [
        { category: { slug: "golf" } },
        { category: { parent: { slug: "golf" } } },
      ],
    },
    orderBy: [
      { isBest: "desc" },
      { rankPosition: { sort: "asc", nulls: "last" } },
      { isNew: "desc" },
      { createdAt: "desc" },
    ],
    take: limit,
    include: {
      brand: { select: { name: true, slug: true } },
      images: { where: { isMain: true }, take: 1 },
    },
  });
}

/**
 * Brand Focus 섹션 — 특정 브랜드의 ACTIVE 상품.
 * 이미지 있는 상품 우선 (메인 노출 품질 가드).
 * 정렬: createdAt desc
 */
export async function getBrandFocusProducts(brandSlug: string, limit = 4) {
  return prisma.product.findMany({
    where: {
      ...USER_FACING_GUARD,
      brand: { slug: brandSlug },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      brand: { select: { name: true, slug: true, nameKo: true } },
      images: { where: { isMain: true }, take: 1 },
    },
  });
}

/**
 * Brand Focus 자동 선택 — 골프 카테고리에서 ACTIVE 상품이 가장 많은 브랜드 1개.
 * 어뉴골프가 상품 많으면 자동으로 선택됨. 운영자가 별도 지정 안 해도 동작.
 */
export async function pickBrandFocusSlug(): Promise<string | null> {
  const result = await prisma.product.groupBy({
    by: ["brandId"],
    where: {
      ...USER_FACING_GUARD,
      OR: [
        { category: { slug: "golf" } },
        { category: { parent: { slug: "golf" } } },
      ],
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 1,
  });
  if (!result[0]) return null;
  const brand = await prisma.brand.findUnique({
    where: { id: result[0].brandId },
    select: { slug: true },
  });
  return brand?.slug ?? null;
}

export async function getAllProducts(options?: {
  categorySlug?: string;
  brandSlug?: string;
  search?: string;
  sort?: string;
  limit?: number;
  offset?: number;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
}) {
  const { categorySlug, brandSlug, search, sort = "popular", limit = 24, offset = 0 } = options ?? {};

  const conditions: Record<string, unknown>[] = [USER_FACING_GUARD];

  if (categorySlug) {
    conditions.push({
      OR: [
        { category: { slug: categorySlug } },
        { category: { parent: { slug: categorySlug } } },
      ],
    });
  }
  if (brandSlug) {
    conditions.push({ brand: { slug: brandSlug } });
  }
  if (search) {
    conditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { brand: { name: { contains: search, mode: "insensitive" } } },
        { tags: { some: { tag: { contains: search, mode: "insensitive" } } } },
      ],
    });
  }
  if (options?.minPrice !== undefined || options?.maxPrice !== undefined) {
    const priceCondition: any = {};
    if (options.minPrice !== undefined) priceCondition.gte = options.minPrice;
    if (options.maxPrice !== undefined) priceCondition.lte = options.maxPrice;
    conditions.push({
      OR: [
        { salePrice: priceCondition },
        { salePrice: null, originalPrice: priceCondition },
      ],
    });
  }
  if (options?.sizes && options.sizes.length > 0) {
    conditions.push({ variants: { some: { size: { in: options.sizes }, isActive: true } } });
  }
  if (options?.colors && options.colors.length > 0) {
    conditions.push({ variants: { some: { color: { in: options.colors }, isActive: true } } });
  }

  const where = { AND: conditions };

  const orderBy: Record<string, string> =
    sort === "newest" ? { createdAt: "desc" }
    : sort === "price_asc" ? { salePrice: "asc" }
    : sort === "price_desc" ? { originalPrice: "desc" }
    : { viewCount: "desc" }; // popular

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: where as any,
      orderBy: orderBy as any,
      take: limit,
      skip: offset,
      include: {
        brand: { select: { name: true, slug: true } },
        images: { where: { isMain: true }, take: 1 },
      },
    }),
    prisma.product.count({ where: where as any }),
  ]);

  return { products, total };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      category: { include: { parent: true } },
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true } },
      tags: true,
    },
  });
}

// ─── Product variants for admin ───

export async function getProductVariants(productId: string) {
  return prisma.productVariant.findMany({
    where: { productId },
    orderBy: [{ color: "asc" }, { size: "asc" }],
  });
}

// ─── Search filter options ───

export async function getFilterOptions(search?: string) {
  const where = search ? {
    status: "ACTIVE" as const,
    OR: [
      { name: { contains: search, mode: "insensitive" as const } },
      { brand: { name: { contains: search, mode: "insensitive" as const } } },
    ],
  } : { status: "ACTIVE" as const };

  const [prices, variants] = await Promise.all([
    prisma.product.aggregate({
      where: where as any,
      _min: { originalPrice: true },
      _max: { originalPrice: true },
    }),
    prisma.productVariant.findMany({
      where: { product: where as any, isActive: true },
      select: { color: true, size: true },
      distinct: ["color", "size"],
    }),
  ]);

  const colors = [...new Set(variants.map(v => v.color).filter(Boolean))] as string[];
  const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))] as string[];

  return {
    minPrice: prices._min.originalPrice ?? 0,
    maxPrice: prices._max.originalPrice ?? 500000,
    colors,
    sizes,
  };
}
