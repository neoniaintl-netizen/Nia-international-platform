import { prisma } from "./db";

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

// ─── Banner helpers ───

export async function getActiveBanners(position = "HOME_MAIN") {
  const now = new Date();
  return prisma.banner.findMany({
    where: {
      position,
      isActive: true,
      OR: [
        { startsAt: null },
        { startsAt: { lte: now }, endsAt: { gte: now } },
        { startsAt: { lte: now }, endsAt: null },
      ],
    },
    orderBy: { sortOrder: "asc" },
  });
}

// ─── Content helpers ───

export async function getPublishedMagazines(limit = 6) {
  return prisma.magazine.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export async function getSnaps(limit = 12) {
  return prisma.snap.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUpcomingReleases(limit = 6) {
  return prisma.release.findMany({
    where: { status: "UPCOMING" },
    orderBy: { releaseDate: "asc" },
    take: limit,
  });
}

export async function getReleasedItems(limit = 4) {
  return prisma.release.findMany({
    where: { status: { in: ["RELEASED", "SOLDOUT"] } },
    orderBy: { releaseDate: "desc" },
    take: limit,
  });
}

// ─── Cart helpers ───

export async function getUserCart(userId: string) {
  return prisma.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          brand: { select: { name: true, slug: true } },
          images: { where: { isMain: true }, take: 1 },
        },
      },
      variant: true,
    },
  });
}

export async function getCartCount(userId: string) {
  return prisma.cartItem.count({ where: { userId } });
}

// ─── Wishlist helpers ───

export async function getUserWishlist(userId: string) {
  return prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          brand: { select: { name: true, slug: true } },
          images: { where: { isMain: true }, take: 1 },
        },
      },
    },
  });
}

export async function getUserWishlistIds(userId: string) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    select: { productId: true },
  });
  return new Set(items.map((i) => i.productId));
}

// ─── Order helpers ───

export async function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      payment: true,
      address: true,
    },
  });
}

export async function getOrderById(orderId: string, userId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: true,
      payment: true,
      address: true,
    },
  });
}

export async function getOrderStatusCounts(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    select: { status: true },
  });
  return {
    paid: orders.filter((o) => o.status === "PAID").length,
    preparing: orders.filter((o) => o.status === "PREPARING").length,
    shipped: orders.filter((o) => o.status === "SHIPPED").length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    cancelled: orders.filter((o) => o.status === "CANCELLED").length,
  };
}

export async function getUserPoints(userId: string) {
  const result = await prisma.pointHistory.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

export async function getUserCouponCount(userId: string) {
  return prisma.userCoupon.count({
    where: { userId, usedAt: null, coupon: { expiresAt: { gte: new Date() } } },
  });
}

// ─── Profile helpers ───

export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      nickname: true,
      phone: true,
      gender: true,
      birthDate: true,
      profileImage: true,
      role: true,
      createdAt: true,
      passwordHash: true,
    },
  });
}

export async function getUserAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }],
  });
}

export async function getUserCoupons(userId: string) {
  return prisma.userCoupon.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
    include: { coupon: true },
  });
}

export async function getPointHistory(userId: string) {
  return prisma.pointHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

// ─── Review helpers ───

export async function getProductReviews(productId: string, limit = 20, offset = 0) {
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        user: { select: { id: true, nickname: true, name: true } },
      },
    }),
    prisma.review.count({ where: { productId } }),
  ]);
  return { reviews, total };
}

export async function getReviewStats(productId: string) {
  const reviews = await prisma.review.findMany({
    where: { productId },
    select: { rating: true },
  });
  const total = reviews.length;
  if (total === 0) return { total: 0, avg: 0, distribution: [0, 0, 0, 0, 0] };
  const sum = reviews.reduce((a, r) => a + r.rating, 0);
  const distribution = [1, 2, 3, 4, 5].map(
    (r) => reviews.filter((rv) => rv.rating === r).length
  );
  return { total, avg: sum / total, distribution };
}

export async function hasUserPurchasedProduct(userId: string, productId: string) {
  const order = await prisma.order.findFirst({
    where: {
      userId,
      status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] },
      items: { some: { productId } },
    },
    select: { id: true },
  });
  return !!order;
}

export async function getUserReview(userId: string, productId: string) {
  return prisma.review.findUnique({
    where: { userId_productId: { userId, productId } },
  });
}

// ─── Inquiry helpers ───

export async function getProductInquiries(productId: string, limit = 20, offset = 0) {
  const [inquiries, total] = await Promise.all([
    prisma.productInquiry.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        user: { select: { id: true, nickname: true, name: true } },
      },
    }),
    prisma.productInquiry.count({ where: { productId } }),
  ]);
  return { inquiries, total };
}

// ─── CrawlJob helpers ───

export async function getCrawlJobs(limit = 20, offset = 0) {
  const [jobs, total] = await Promise.all([
    prisma.crawlJob.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.crawlJob.count(),
  ]);
  return { jobs, total };
}

export async function getCrawlJobById(id: string) {
  return prisma.crawlJob.findUnique({ where: { id } });
}

export async function getCrawlJobStats() {
  const [total, running, completed, failed, pending] = await Promise.all([
    prisma.crawlJob.count(),
    prisma.crawlJob.count({ where: { status: "RUNNING" } }),
    prisma.crawlJob.count({ where: { status: "COMPLETED" } }),
    prisma.crawlJob.count({ where: { status: "FAILED" } }),
    prisma.crawlJob.count({ where: { status: "PENDING" } }),
  ]);

  const totalProducts = await prisma.product.count({
    where: { sourceSite: { not: null } },
  });

  return { total, running, completed, failed, pending, totalProducts };
}

// ─── Featured brands for home ───

export async function getFeaturedBrands(limit = 6) {
  return prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { followerCount: "desc" },
    take: limit,
  });
}

// ─── Admin dashboard ───

export async function getAdminDashboardStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalProducts,
    activeProducts,
    draftProducts,
    totalOrders,
    todayOrders,
    monthRevenue,
    totalUsers,
    totalBrands,
    totalBanners,
    totalCoupons,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.product.count({ where: { status: "DRAFT" } }),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: monthStart }, status: { not: "CANCELLED" } },
      _sum: { finalAmount: true },
    }),
    prisma.user.count(),
    prisma.brand.count(),
    prisma.banner.count(),
    prisma.coupon.count(),
  ]);

  return {
    totalProducts,
    activeProducts,
    draftProducts,
    totalOrders,
    todayOrders,
    monthRevenue: monthRevenue._sum.finalAmount ?? 0,
    totalUsers,
    totalBrands,
    totalBanners,
    totalCoupons,
  };
}

// ─── Admin: Products ───

export async function getAdminProducts(options?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const { status, search, limit = 20, offset = 0 } = options ?? {};
  const conditions: any[] = [];
  if (status) conditions.push({ status });
  if (search) {
    conditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { brand: { name: { contains: search, mode: "insensitive" } } },
      ],
    });
  }
  const where = conditions.length > 0 ? { AND: conditions } : undefined;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
        _count: { select: { variants: true, images: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total };
}

// ─── Admin: Orders ───

export async function getAdminOrders(options?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const { status, search, limit = 20, offset = 0 } = options ?? {};
  const conditions: any[] = [];
  if (status) conditions.push({ status });
  if (search) {
    conditions.push({
      OR: [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ],
    });
  }
  const where = conditions.length > 0 ? { AND: conditions } : undefined;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        user: { select: { email: true, name: true } },
        items: { select: { id: true } },
        payment: { select: { status: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total };
}

// ─── Admin: Users ───

export async function getAdminUsers(options?: {
  role?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const { role, search, limit = 20, offset = 0 } = options ?? {};
  const conditions: any[] = [];
  if (role) conditions.push({ role });
  if (search) {
    conditions.push({
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { nickname: { contains: search, mode: "insensitive" } },
      ],
    });
  }
  const where = conditions.length > 0 ? { AND: conditions } : undefined;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        role: true,
        createdAt: true,
        _count: { select: { orders: true, reviews: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

// ─── Admin: Banners ───

export async function getAdminBanners() {
  return prisma.banner.findMany({ orderBy: { sortOrder: "asc" } });
}

// ─── Admin: Coupons ───

export async function getAdminCoupons() {
  return prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { userCoupons: true } } },
  });
}

// ─── Return Request helpers ───

export async function getReturnRequest(orderId: string) {
  return prisma.returnRequest.findFirst({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminReturnRequests(status?: string) {
  const where = status ? { status: status as any } : undefined;
  return prisma.returnRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      order: { select: { orderNumber: true, finalAmount: true } },
      user: { select: { email: true, name: true } },
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

// ─── Low stock products ───

export async function getLowStockProducts(threshold = 5) {
  return prisma.product.findMany({
    where: {
      status: "ACTIVE",
      variants: { some: { stock: { lte: threshold, gt: 0 } } },
    },
    include: {
      brand: { select: { name: true } },
      variants: { where: { stock: { lte: threshold } } },
    },
    take: 10,
  });
}

// ─── User available coupons (for checkout) ───

export async function getUserAvailableCoupons(userId: string) {
  const now = new Date();
  return prisma.userCoupon.findMany({
    where: {
      userId,
      usedAt: null,
      coupon: {
        isActive: true,
        startsAt: { lte: now },
        expiresAt: { gte: now },
      },
    },
    include: { coupon: true },
    orderBy: { issuedAt: "desc" },
  });
}

// ─── Admin: Categories ───

export async function getAdminCategories() {
  return prisma.category.findMany({
    where: { depth: 0 },
    orderBy: { sortOrder: "asc" },
    include: {
      children: {
        orderBy: { sortOrder: "asc" },
        include: {
          _count: { select: { products: true } },
          children: { orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } },
        },
      },
      _count: { select: { products: true } },
    },
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
