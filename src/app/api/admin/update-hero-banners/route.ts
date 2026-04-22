import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/admin/update-hero-banners
 *   Headers: { x-crawl-key: nkbus2026 }
 *
 * 기존 Hero 위치 Banner들을 새 컨텐츠로 일괄 교체:
 * - 첫 번째: 골프 폴로 모델 이미지 (방금 업로드한 /banners/hero-golf-polo.png)
 * - 나머지는 기존 것 그대로 두거나 삭제
 */

const NEW_BANNERS = [
  {
    title: "2026 S/S Golf Edit",
    subtitle: "Premium Performance · Refined Silhouette",
    imageUrl: "/banners/hero-golf-polo.png",
    linkUrl: "/category/golf",
    position: "HOME_MAIN",
    sortOrder: 0,
    isActive: true,
  },
];

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-crawl-key");
  if (key !== "nkbus2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // HOME_MAIN 포지션 기존 배너 전부 비활성화
  const deactivated = await prisma.banner.updateMany({
    where: { position: "HOME_MAIN" },
    data: { isActive: false },
  });

  // 새 배너들 생성
  const created = [];
  for (const b of NEW_BANNERS) {
    const banner = await prisma.banner.create({ data: b });
    created.push({
      id: banner.id,
      title: banner.title,
      imageUrl: banner.imageUrl,
    });
  }

  return NextResponse.json({
    success: true,
    deactivatedOld: deactivated.count,
    created,
  });
}
