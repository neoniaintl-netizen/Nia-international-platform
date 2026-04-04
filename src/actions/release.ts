"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleReleaseNotify(releaseId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "로그인이 필요합니다." };
  }

  const release = await prisma.release.findUnique({
    where: { id: releaseId },
  });

  if (!release) {
    return { error: "발매 정보를 찾을 수 없습니다." };
  }

  if (release.status !== "UPCOMING") {
    return { error: "이미 발매된 상품입니다." };
  }

  const existing = await prisma.releaseSubscription.findUnique({
    where: { releaseId_userId: { releaseId, userId: session.user.id } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.releaseSubscription.delete({ where: { id: existing.id } }),
      prisma.release.update({ where: { id: releaseId }, data: { notifyCount: { decrement: 1 } } }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.releaseSubscription.create({ data: { releaseId, userId: session.user.id } }),
      prisma.release.update({ where: { id: releaseId }, data: { notifyCount: { increment: 1 } } }),
    ]);
  }

  const updated = await prisma.release.findUnique({
    where: { id: releaseId },
    select: { notifyCount: true },
  });

  revalidatePath("/release");
  return { success: true, subscribed: !existing, notifyCount: updated?.notifyCount ?? 0 };
}
