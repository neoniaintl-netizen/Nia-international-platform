import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다.");
  }
  return session.user.id;
}
