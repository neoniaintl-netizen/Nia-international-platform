"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "./shared";

// ═══════════════════════════════════════
// USER ACTIONS
// ═══════════════════════════════════════

export async function updateUserRole(userId: string, role: string) {
  await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { role: role as any },
  });
  revalidatePath("/admin/users");
  return { success: true };
}

// ─── 승인제: 가입 승인 / 승인 취소 ───

export async function approveUser(userId: string) {
  await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { approvedAt: new Date() },
  });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function revokeApproval(userId: string) {
  await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { approvedAt: null },
  });
  revalidatePath("/admin/users");
  return { success: true };
}
