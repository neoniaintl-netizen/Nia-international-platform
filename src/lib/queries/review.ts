import { prisma } from "../db";

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
