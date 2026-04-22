"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/** RPxxxxxxx 형식의 수선번호 생성 */
function generateRepairNumber() {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `RP${ymd}${rand}`;
}

export async function createRepairRequestAction(
  _prev: any,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "로그인이 필요합니다." };
  }

  const productName = (formData.get("productName") as string)?.trim();
  const brandName = (formData.get("brandName") as string)?.trim() || null;
  const orderNumber = (formData.get("orderNumber") as string)?.trim() || null;
  const issue = (formData.get("issue") as string)?.trim();
  const pickupAddress = (formData.get("pickupAddress") as string)?.trim() || null;
  const imageUrlsRaw = formData.get("imageUrls") as string;
  const imageUrls = imageUrlsRaw
    ? imageUrlsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  if (!productName || !issue) {
    return { error: "상품명과 수선 요청 내용을 입력해주세요." };
  }

  if (issue.length < 10) {
    return { error: "수선 요청 내용을 10자 이상 입력해주세요." };
  }

  const request = await prisma.repairRequest.create({
    data: {
      requestNumber: generateRepairNumber(),
      userId: session.user.id,
      productName,
      brandName,
      orderNumber,
      issue,
      pickupAddress,
      imageUrls,
      status: "RECEIVED",
    },
  });

  revalidatePath("/my/repair");
  return {
    success: true,
    requestNumber: request.requestNumber,
    message: "수선 신청이 접수되었습니다. 담당자가 2영업일 이내 연락드립니다.",
  };
}

export async function cancelRepairRequestAction(requestId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "로그인이 필요합니다." };
  }

  const repair = await prisma.repairRequest.findFirst({
    where: { id: requestId, userId: session.user.id },
  });

  if (!repair) return { error: "수선 요청을 찾을 수 없습니다." };
  if (!["RECEIVED", "INSPECTING", "QUOTED"].includes(repair.status)) {
    return { error: "현재 상태에서는 취소할 수 없습니다." };
  }

  await prisma.repairRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/my/repair");
  return { success: true };
}
