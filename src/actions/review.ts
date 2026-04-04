"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.");
  return session.user.id;
}

export async function createReview(
  _prevState: { success?: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    const userId = await getUserId();
    const productId = formData.get("productId") as string;
    const rating = parseInt(formData.get("rating") as string, 10);
    const content = (formData.get("content") as string)?.trim();
    const imageUrlsRaw = formData.get("imageUrls") as string;
    let imageUrls: string[] = [];
    try {
      imageUrls = imageUrlsRaw ? JSON.parse(imageUrlsRaw) : [];
    } catch { /* ignore */ }

    if (!productId || !rating || !content) {
      return { error: "별점과 리뷰 내용을 입력해주세요." };
    }
    if (rating < 1 || rating > 5) {
      return { error: "별점은 1~5 사이로 입력해주세요." };
    }
    if (content.length < 10) {
      return { error: "리뷰는 10자 이상 작성해주세요." };
    }

    // Check if already reviewed
    const existing = await prisma.review.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) {
      return { error: "이미 리뷰를 작성하셨습니다." };
    }

    // Check if purchased (for verified badge)
    const order = await prisma.order.findFirst({
      where: {
        userId,
        status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] },
        items: { some: { productId } },
      },
      select: { id: true },
    });

    // Create review and update product stats in transaction
    await prisma.$transaction(async (tx) => {
      await tx.review.create({
        data: {
          userId,
          productId,
          rating,
          content,
          imageUrls,
          isVerified: !!order,
        },
      });

      // Update product review stats
      const stats = await tx.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { id: true },
      });

      await tx.product.update({
        where: { id: productId },
        data: {
          reviewCount: stats._count.id,
          reviewAvg: stats._avg.rating ?? 0,
        },
      });
    });

    revalidatePath(`/products/[id]`, "page");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "리뷰 작성에 실패했습니다." };
  }
}

export async function deleteReview(reviewId: string, productId: string) {
  try {
    const userId = await getUserId();

    const review = await prisma.review.findFirst({
      where: { id: reviewId, userId },
    });
    if (!review) {
      return { error: "삭제할 리뷰를 찾을 수 없습니다." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: reviewId } });

      const stats = await tx.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { id: true },
      });

      await tx.product.update({
        where: { id: productId },
        data: {
          reviewCount: stats._count.id,
          reviewAvg: stats._avg.rating ?? 0,
        },
      });
    });

    revalidatePath(`/products/[id]`, "page");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "리뷰 삭제에 실패했습니다." };
  }
}

export async function toggleHelpful(reviewId: string) {
  try {
    await prisma.review.update({
      where: { id: reviewId },
      data: { helpfulCount: { increment: 1 } },
    });
    revalidatePath(`/products/[id]`, "page");
    return { success: true };
  } catch {
    return { error: "오류가 발생했습니다." };
  }
}
