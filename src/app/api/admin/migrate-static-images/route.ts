import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { STATIC_BRAND_IMAGES } from "@/lib/static-brand-images";

export const runtime = "nodejs";
export const maxDuration = 300;

const BodySchema = z
  .object({
    brandSlug: z.string().min(1).max(100).optional(),
    dryRun: z.boolean().optional().default(true),
    /**
     * true면 hasReal 체크 없이 모든 상품 이미지를 정적 풀로 덮어씀.
     * 이전 마이그가 hero/marketing 이미지를 박아놓은 상태를 정밀 이미지로 갱신할 때 사용.
     */
    force: z.boolean().optional().default(false),
  })
  .strict();

/**
 * POST /api/admin/migrate-static-images
 *
 * 로컬에서 추출해 코드에 박힌 static-brand-images.ts 데이터로
 * placehold.co URL을 가진 상품들의 이미지를 일괄 교체.
 *
 * 멱등성: 이미 진짜 이미지가 있는 상품은 건너뜀 (수동 매핑 보호).
 *
 * Body:
 *   { brandSlug?: string, dryRun?: boolean }
 *   - brandSlug 없으면 9개 모두 처리
 *   - dryRun=true (기본) — 어떤 상품이 영향받는지 미리보기, DB 변경 X
 *   - dryRun=false — 실제 적용
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }
  const { brandSlug, dryRun, force } = parsed.data;

  const entries = brandSlug
    ? Object.entries(STATIC_BRAND_IMAGES).filter(([k]) => k === brandSlug)
    : Object.entries(STATIC_BRAND_IMAGES);

  if (entries.length === 0) {
    return NextResponse.json(
      { error: `brand 매핑 없음: ${brandSlug}` },
      { status: 404 }
    );
  }

  const results: Array<{
    brandSlug: string;
    pool: number;
    productsTotal: number;
    productsToUpdate: number;
    productsUpdated?: number;
    skipped: number;
    notFound?: boolean;
    sampleNew?: string[][];
  }> = [];

  for (const [slug, imageUrls] of entries) {
    if (imageUrls.length === 0) {
      results.push({
        brandSlug: slug,
        pool: 0,
        productsTotal: 0,
        productsToUpdate: 0,
        skipped: 0,
      });
      continue;
    }

    const brand = await prisma.brand.findFirst({
      where: {
        OR: [
          { slug: slug },
          { slug: slug.replace("-", "") },
          { name: { contains: slug.replace("-", " "), mode: "insensitive" } },
        ],
      },
    });
    if (!brand) {
      results.push({
        brandSlug: slug,
        pool: imageUrls.length,
        productsTotal: 0,
        productsToUpdate: 0,
        skipped: 0,
        notFound: true,
      });
      continue;
    }

    const products = await prisma.product.findMany({
      where: { brandId: brand.id },
      include: { images: true },
    });

    const targetIndices: number[] = [];
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      // force=true면 모든 상품 대상. false면 placehold.co URL 가진 상품만.
      if (!force) {
        const hasReal = product.images.some(
          (img) =>
            !img.url.includes("placehold.co") &&
            !img.url.includes("placeholder")
        );
        if (hasReal && product.images.length > 0) continue;
      }
      targetIndices.push(i);
    }

    const sampleNew: string[][] = [];
    let updated = 0;
    for (const idx of targetIndices) {
      const product = products[idx];
      const baseIdx = idx * 3;
      const newUrls = [
        imageUrls[baseIdx % imageUrls.length],
        imageUrls[(baseIdx + 1) % imageUrls.length],
        imageUrls[(baseIdx + 2) % imageUrls.length],
      ].filter((v, i, arr) => arr.indexOf(v) === i);

      if (sampleNew.length < 3) sampleNew.push(newUrls);

      if (dryRun) continue;

      try {
        await prisma.$transaction(async (tx) => {
          await tx.productImage.deleteMany({ where: { productId: product.id } });
          for (let j = 0; j < newUrls.length; j++) {
            await tx.productImage.create({
              data: {
                productId: product.id,
                url: newUrls[j],
                isMain: j === 0,
                sortOrder: j,
              },
            });
          }
        });
        updated += 1;
      } catch (e) {
        console.error(`[migrate-static] product ${product.id}:`, e);
      }
    }

    results.push({
      brandSlug: slug,
      pool: imageUrls.length,
      productsTotal: products.length,
      productsToUpdate: targetIndices.length,
      productsUpdated: dryRun ? undefined : updated,
      skipped: products.length - targetIndices.length,
      sampleNew,
    });
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    force,
    summary: {
      brandsProcessed: results.length,
      totalToUpdate: results.reduce((s, r) => s + r.productsToUpdate, 0),
      totalUpdated: results.reduce((s, r) => s + (r.productsUpdated ?? 0), 0),
    },
    results,
  });
}
