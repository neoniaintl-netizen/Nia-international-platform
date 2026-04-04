import { prisma } from "./db";

// ─── Product helpers ───

export async function getRankedProducts(limit = 8) {
  return prisma.product.findMany({
    where: { status: "ACTIVE", rankPosition: { not: null } },
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
    where: { status: "ACTIVE" },
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
    where: { status: "ACTIVE" },
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
    where: { status: "ACTIVE", salePrice: { not: null } },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      brand: { select: { name: true, slug: true } },
      images: { where: { isMain: true }, take: 1 },
    },
  });
}

export async function getNewProducts(limit = 8) {
  return prisma.product.findMany({
    where: { status: "ACTIVE", isNew: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      brand: { select: { name: true, slug: true } },
      images: { where: { isMain: true }, take: 1 },
    },
  });
}

export async function getAllProducts(options?: {
  categorySlug?: string;
  brandSlug?: string;
  search?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}) {
  const { categorySlug, brandSlug, search, sort = "popular", limit = 24, offset = 0 } = options ?? {};

  const conditions: Record<string, unknown>[] = [{ status: "ACTIVE" as const }];

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
