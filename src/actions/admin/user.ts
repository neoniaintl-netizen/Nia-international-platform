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
