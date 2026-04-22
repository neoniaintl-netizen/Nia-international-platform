"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function toggleBrandFollow(brandId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "로그인이 필요합니다.", requireAuth: true };
  }

  const userId = session.user.id;
  const existing = await prisma.brandFollow.findUnique({
    where: { userId_brandId: { userId, brandId } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.brandFollow.delete({
        where: { userId_brandId: { userId, brandId } },
      }),
      prisma.brand.update({
        where: { id: brandId },
        data: { followerCount: { decrement: 1 } },
      }),
    ]);
    revalidatePath("/my/brands");
    return { following: false };
  } else {
    await prisma.$transaction([
      prisma.brandFollow.create({ data: { userId, brandId } }),
      prisma.brand.update({
        where: { id: brandId },
        data: { followerCount: { increment: 1 } },
      }),
    ]);
    revalidatePath("/my/brands");
    return { following: true };
  }
}

export async function isFollowingBrand(brandId: string) {
  const session = await auth();
  if (!session?.user?.id) return false;
  const f = await prisma.brandFollow.findUnique({
    where: { userId_brandId: { userId: session.user.id, brandId } },
  });
  return !!f;
}
