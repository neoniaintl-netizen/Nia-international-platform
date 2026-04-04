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

  // notifyCount 증가 (MVP: 단순 증가, 실제로는 유저별 구독 테이블 필요)
  await prisma.release.update({
    where: { id: releaseId },
    data: { notifyCount: { increment: 1 } },
  });

  revalidatePath("/release");
  return { success: true, notifyCount: release.notifyCount + 1 };
}
