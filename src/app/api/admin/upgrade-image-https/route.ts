import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";

/**
 * POST /api/admin/upgrade-image-https
 * DB에 저장된 ProductImage.url 중 http:// 를 https:// 로 일괄 업그레이드
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const httpImages = await prisma.productImage.findMany({
    where: { url: { startsWith: "http://" } },
    select: { id: true, url: true },
  });

  let updated = 0;
  for (const img of httpImages) {
    await prisma.productImage.update({
      where: { id: img.id },
      data: { url: img.url.replace(/^http:\/\//, "https://") },
    });
    updated++;
  }

  return NextResponse.json({
    success: true,
    scanned: httpImages.length,
    updated,
  });
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const count = await prisma.productImage.count({
    where: { url: { startsWith: "http://" } },
  });

  return NextResponse.json({ httpImages: count });
}
