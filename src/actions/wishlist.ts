"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.");
  return session.user.id;
}

// ─── 위시리스트 토글 (추가/삭제) ───

export async function toggleWishlist(productId: string) {
  const userId = await getUserId();

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    revalidatePath("/wishlist");
    return { wishlisted: false };
  } else {
    await prisma.wishlistItem.create({
      data: { userId, productId },
    });
    revalidatePath("/wishlist");
    return { wishlisted: true };
  }
}

// ─── 위시리스트 여부 확인 (여러 상품) ───

export async function getWishlistStatus(productIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) return {};

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id, productId: { in: productIds } },
    select: { productId: true },
  });

  const map: Record<string, boolean> = {};
  for (const item of items) {
    map[item.productId] = true;
  }
  return map;
}
