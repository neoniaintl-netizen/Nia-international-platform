import { NextRequest, NextResponse } from "next/server";
import { requireOpsToken } from "@/lib/ops-auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/admin/approve-drafts
 *   Headers: { x-ops-token: <ADMIN_OPS_TOKEN> }
 *   Body (optional): { jobId?: string, brandSlug?: string, minImages?: number }
 *
 * DRAFT 상품을 ACTIVE로 일괄 전환.
 * - jobId 지정 시 해당 Job 상품만
 * - brandSlug 지정 시 해당 브랜드 상품만
 * - 둘 다 미지정 시 모든 DRAFT
 * - minImages: 이미지 개수 이상인 상품만 (기본 1)
 */
export async function POST(req: NextRequest) {
  const block = requireOpsToken(req);
  if (block) return block;

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const { jobId, brandSlug, minImages = 1 } = body;

  const where: any = { status: "DRAFT" };
  if (jobId) where.crawlJobId = jobId;
  if (brandSlug) {
    const brand = await prisma.brand.findUnique({
      where: { slug: brandSlug },
      select: { id: true },
    });
    if (!brand) {
      return NextResponse.json(
        { error: `브랜드 ${brandSlug} 없음` },
        { status: 404 }
      );
    }
    where.brandId = brand.id;
  }

  // 이미지 개수 조건 체크를 위해 먼저 조회
  const drafts = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      originalPrice: true,
      _count: { select: { images: true } },
    },
  });

  const toApprove = drafts.filter(
    (p) => p._count.images >= minImages && p.originalPrice > 0 && p.name.length > 2
  );
  const skipped = drafts.length - toApprove.length;

  if (toApprove.length === 0) {
    return NextResponse.json({
      success: true,
      message: "승인할 상품이 없습니다",
      scanned: drafts.length,
      approved: 0,
      skipped,
    });
  }

  const result = await prisma.product.updateMany({
    where: { id: { in: toApprove.map((p) => p.id) } },
    data: { status: "ACTIVE" },
  });

  return NextResponse.json({
    success: true,
    scanned: drafts.length,
    approved: result.count,
    skipped,
    criteria: { minImages, minPriceGt: 0, minNameLength: 3 },
  });
}

export async function GET(req: NextRequest) {
  const block = requireOpsToken(req);
  if (block) return block;

  // 각 브랜드별 상태 요약
  const stats = await prisma.product.groupBy({
    by: ["brandId", "status"],
    _count: { id: true },
  });

  const brands = await prisma.brand.findMany({
    select: { id: true, slug: true, name: true, nameKo: true },
  });

  const summary = brands.map((b) => {
    const draft = stats.find((s) => s.brandId === b.id && s.status === "DRAFT");
    const active = stats.find(
      (s) => s.brandId === b.id && s.status === "ACTIVE"
    );
    return {
      slug: b.slug,
      name: b.name,
      nameKo: b.nameKo,
      draft: draft?._count.id ?? 0,
      active: active?._count.id ?? 0,
    };
  });

  return NextResponse.json({ summary });
}
