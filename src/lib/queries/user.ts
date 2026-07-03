import { prisma } from "../db";

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

// ─── Return Request helpers ───

export async function getReturnRequest(orderId: string) {
  return prisma.returnRequest.findFirst({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });
}
