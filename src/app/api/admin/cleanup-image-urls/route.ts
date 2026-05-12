import { NextRequest, NextResponse } from "next/server";
import { requireOpsToken } from "@/lib/ops-auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/admin/cleanup-image-urls
 *   Headers: { x-ops-token: <ADMIN_OPS_TOKEN> }
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
  let cleaned = url;

  // ?thumbnail 같은 단순 flag 쿼리 제거
  if (cleaned.includes("?thumbnail")) {
    cleaned = cleaned.replace(/\?thumbnail.*$/i, "");
  }
  if (cleaned.includes("?sm")) {
    cleaned = cleaned.replace(/\?sm.*$/i, "");
  }

  // NorthFace URL 정제: 쿼리 제거 + 특수문자(+%281%29 같은 것) 제거
  if (cleaned.includes("thenorthfacekorea.co.kr")) {
    cleaned = cleaned.split("?")[0];
    // "+%281%29" (공백 + "(1)") 제거 → 표준 URL만 남김
    cleaned = cleaned.replace(/\+%28\d+%29/g, "");
    cleaned = cleaned.replace(/\+\(\d+\)/g, "");
    // 끝의 `\` 이스케이프 제거
    cleaned = cleaned.replace(/\\+$/, "");
  }

  return cleaned;
}

export async function POST(req: NextRequest) {
  const block = requireOpsToken(req);
  if (block) return block;

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
  const block = requireOpsToken(req);
  if (block) return block;

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
