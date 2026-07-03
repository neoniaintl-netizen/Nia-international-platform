import { prisma } from "../db";

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
