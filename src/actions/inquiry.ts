"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.");
  return session.user.id;
}

export async function createInquiry(
  _prevState: { success?: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    const userId = await getUserId();
    const productId = formData.get("productId") as string;
    const title = (formData.get("title") as string)?.trim();
    const content = (formData.get("content") as string)?.trim();
    const isSecret = formData.get("isSecret") === "on";

    if (!productId || !title || !content) {
      return { error: "제목과 내용을 입력해주세요." };
    }
    if (title.length < 2) {
      return { error: "제목은 2자 이상 입력해주세요." };
    }
    if (content.length < 5) {
      return { error: "내용은 5자 이상 작성해주세요." };
    }

    await prisma.productInquiry.create({
      data: {
        userId,
        productId,
        title,
        content,
        isSecret,
      },
    });

    revalidatePath(`/products/[id]`, "page");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "문의 등록에 실패했습니다." };
  }
}

export async function deleteInquiry(inquiryId: string) {
  try {
    const userId = await getUserId();

    const inquiry = await prisma.productInquiry.findFirst({
      where: { id: inquiryId, userId },
    });
    if (!inquiry) {
      return { error: "삭제할 문의를 찾을 수 없습니다." };
    }

    await prisma.productInquiry.delete({ where: { id: inquiryId } });

    revalidatePath(`/products/[id]`, "page");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "문의 삭제에 실패했습니다." };
  }
}
