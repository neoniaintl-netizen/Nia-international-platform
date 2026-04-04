"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.");
  return session.user.id;
}

export async function toggleSnapLike(snapId: string) {
  const userId = await getUserId();

  const existing = await prisma.snapLike.findUnique({
    where: { snapId_userId: { snapId, userId } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.snapLike.delete({ where: { id: existing.id } }),
      prisma.snap.update({ where: { id: snapId }, data: { likeCount: { decrement: 1 } } }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.snapLike.create({ data: { snapId, userId } }),
      prisma.snap.update({ where: { id: snapId }, data: { likeCount: { increment: 1 } } }),
    ]);
  }

  revalidatePath(`/snap/${snapId}`);
  revalidatePath("/snap");
  return { success: true, liked: !existing };
}

export async function addSnapComment(_prevState: any, formData: FormData) {
  const userId = await getUserId();
  const snapId = formData.get("snapId") as string;
  const content = (formData.get("content") as string)?.trim();

  if (!content) return { error: "댓글 내용을 입력해주세요." };

  await prisma.$transaction([
    prisma.snapComment.create({ data: { snapId, userId, content } }),
    prisma.snap.update({ where: { id: snapId }, data: { commentCount: { increment: 1 } } }),
  ]);

  revalidatePath(`/snap/${snapId}`);
  return { success: true };
}

export async function deleteSnapComment(commentId: string) {
  const userId = await getUserId();

  const comment = await prisma.snapComment.findFirst({
    where: { id: commentId, userId },
  });
  if (!comment) return { error: "댓글을 찾을 수 없습니다." };

  await prisma.$transaction([
    prisma.snapComment.delete({ where: { id: commentId } }),
    prisma.snap.update({ where: { id: comment.snapId }, data: { commentCount: { decrement: 1 } } }),
  ]);

  revalidatePath(`/snap/${comment.snapId}`);
  return { success: true };
}
