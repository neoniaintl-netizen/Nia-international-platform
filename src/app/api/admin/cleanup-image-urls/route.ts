import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/admin/cleanup-image-urls
 *   Headers: { x-crawl-key: nkbus2026 }
 *
 * ProductImage URL에서 불필요한 쿼리 파라미터(?thumbnail, ?sm, ?cache=*)를
 * 제거하여 원본 고화질 이미지로 정제.
 */

const JUNK_QUERIES = [
  /\?thumbnail$/i,
  /\?thumbnail\b/i,
  /\?sm$/i,
  /\?sm\b/i,
  /\?cache=[^&]+/i,
  /\?v=[^&]+$/i,
];

function cleanUrl(url: string): string {
  if (!url) return url;
  // 쿼리 전체 제거 (단순한 접근: ? 이후 제거, 단 핵심 쿼리가 필요한 경우는 예외 처리)
  // Shopify _2000x 같은 것은 경로에 포함되어 영향 없음
  let cleaned = url;

  // ?thumbnail 같은 단순 flag 쿼리 제거
  if (cleaned.includes("?thumbnail")) {
    cleaned = cleaned.replace(/\?thumbnail.*$/i, "");
  }
  if (cleaned.includes("?sm")) {
    cleaned = cleaned.replace(/\?sm.*$/i, "");
  }

  // NorthFace 케이스 특화: ? 이후 전부 제거 (필요한 쿼리가 없음)
  if (cleaned.includes("thenorthfacekorea.co.kr")) {
    cleaned = cleaned.split("?")[0];
  }

  return cleaned;
}

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-crawl-key");
  if (key !== "nkbus2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const images = await prisma.productImage.findMany({
    select: { id: true, url: true },
  });

  let cleaned = 0;
  let unchanged = 0;
  const samples: Array<{ from: string; to: string }> = [];

  for (const img of images) {
    const newUrl = cleanUrl(img.url);
    if (newUrl !== img.url) {
      await prisma.productImage.update({
        where: { id: img.id },
        data: { url: newUrl },
      });
      cleaned++;
      if (samples.length < 5) {
        samples.push({
          from: img.url.slice(-80),
          to: newUrl.slice(-80),
        });
      }
    } else {
      unchanged++;
    }
  }

  return NextResponse.json({
    success: true,
    total: images.length,
    cleaned,
    unchanged,
    samples,
  });
}

export async function GET(req: NextRequest) {
  const key = req.headers.get("x-crawl-key") || req.nextUrl.searchParams.get("key");
  if (key !== "nkbus2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const images = await prisma.productImage.findMany({
    select: { url: true },
  });

  const withThumbnail = images.filter((i) => /\?thumbnail|\?sm/i.test(i.url)).length;
  const hasAnyQuery = images.filter((i) => i.url.includes("?")).length;

  return NextResponse.json({
    total: images.length,
    withThumbnailQuery: withThumbnail,
    hasAnyQuery,
    sampleDirty: images.filter((i) => i.url.includes("?")).slice(0, 5).map((i) => i.url),
  });
}
