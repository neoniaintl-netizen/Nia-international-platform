"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다.");
  }
}

const VALID_STATUSES = [
  "RECEIVED",
  "INSPECTING",
  "QUOTED",
  "IN_PROGRESS",
  "SHIPPING",
  "COMPLETED",
  "CANCELLED",
];

export async function updateRepairStatusAction(
  id: string,
  newStatus: string
) {
  await requireAdmin();

  if (!VALID_STATUSES.includes(newStatus)) {
    return { error: "유효하지 않은 상태입니다." };
  }

  await prisma.repairRequest.update({
    where: { id },
    data: { status: newStatus as any },
  });

  revalidatePath("/admin/repairs");
  revalidatePath("/my/repair");
  return { success: true };
}
