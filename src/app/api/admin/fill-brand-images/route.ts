import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { BRAND_TARGETS, type BrandTarget } from "@/lib/brand-targets";
import {
  extractImagesFromPage,
  pickProductImages,
} from "@/lib/crawler/image-extractor";

export const runtime = "nodejs";
export const maxDuration = 300; // Railway/Vercel 5분 제한 — 9개 brand 충분

const BodySchema = z
  .object({
    brandSlug: z.string().min(1).max(100).optional(),
    dryRun: z.boolean().optional().default(true),
    mode: z.enum(["hotlink", "download"]).optional().default("hotlink"),
    /** 브랜드당 추출할 최대 이미지 수 */
    maxImages: z.number().int().min(1).max(50).optional().default(16),
  })
  .strict();

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

interface BrandResult {
  brandSlug: string;
  brandName: string;
  pagesFetched: number;
  imagesExtracted: number;
  productsUpdated?: number;
  imagesUploaded?: number;
  imageUrls: string[];
  errors: string[];
}

/**
 * POST /api/admin/fill-brand-images
 *
 * 9개 브랜드의 collection 페이지에서 이미지를 추출해
 * placeholder 상품들을 진짜 이미지로 교체.
 *
 * Body:
 *   { brandSlug?: string, dryRun?: boolean, mode?: "hotlink"|"download", maxImages?: number }
 *
 * - brandSlug 없으면 9개 모두 처리
 * - dryRun=true (기본) — 추출 결과만 반환, DB 변경 X
 * - mode=hotlink — 외부 URL 그대로 DB에 저장 (빠르고 가벼움)
 * - mode=download — public/uploads/products/{brand}/ 에 저장 후 로컬 경로 사용
 *   (Railway는 ephemeral filesystem이므로 재배포 시 사라짐 → R2/S3 권장)
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
    return NextResponse.json(
      { error: "잘못된 요청 본문", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { brandSlug, dryRun, mode, maxImages } = parsed.data;

  const targets = brandSlug
    ? BRAND_TARGETS.filter((t) => t.brandSlug === brandSlug)
    : BRAND_TARGETS;

  if (targets.length === 0) {
    return NextResponse.json(
      { error: `브랜드를 찾을 수 없음: ${brandSlug}` },
      { status: 404 }
    );
  }

  const results: BrandResult[] = [];
  for (const target of targets) {
    const result = await processBrand(target, { dryRun, mode, maxImages });
    results.push(result);
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    mode,
    summary: {
      brandsProcessed: results.length,
      totalImages: results.reduce((s, r) => s + r.imagesExtracted, 0),
      totalProductsUpdated: results.reduce((s, r) => s + (r.productsUpdated ?? 0), 0),
    },
    results,
  });
}

async function processBrand(
  target: BrandTarget,
  opts: { dryRun: boolean; mode: "hotlink" | "download"; maxImages: number }
): Promise<BrandResult> {
  const result: BrandResult = {
    brandSlug: target.brandSlug,
    brandName: target.brandName,
    pagesFetched: 0,
    imagesExtracted: 0,
    imageUrls: [],
    errors: [],
  };

  // 각 collection URL fetch + 이미지 추출
  const collected: string[] = [];
  for (const url of target.collectionUrls) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": BROWSER_UA,
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
          ...(target.referer ? { Referer: target.referer } : {}),
        },
        // 일부 사이트는 응답이 큼
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        result.errors.push(`fetch ${url}: HTTP ${res.status}`);
        continue;
      }
      const html = await res.text();
      result.pagesFetched += 1;
      const extracted = extractImagesFromPage(html, url);
      const picks = pickProductImages(extracted, opts.maxImages);
      for (const u of picks) {
        if (!collected.includes(u)) collected.push(u);
      }
    } catch (e) {
      result.errors.push(
        `fetch ${url}: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  // 중복 제거 + 상한
  const finalImages = collected.slice(0, opts.maxImages);
  result.imagesExtracted = finalImages.length;

  if (finalImages.length === 0) {
    result.errors.push("이미지 0개 추출 — 사이트 HTML 구조 확인 필요");
    return result;
  }

  // download 모드: 우리 서버에 저장
  let usableUrls = finalImages;
  if (opts.mode === "download" && !opts.dryRun) {
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "products",
      target.brandSlug
    );
    await mkdir(uploadDir, { recursive: true });
    const downloaded: string[] = [];
    for (const url of finalImages) {
      try {
        const r = await fetch(url, {
          headers: {
            "User-Agent": BROWSER_UA,
            ...(target.referer ? { Referer: target.referer } : {}),
          },
          signal: AbortSignal.timeout(15_000),
        });
        if (!r.ok) {
          result.errors.push(`download ${url}: HTTP ${r.status}`);
          continue;
        }
        const ct = r.headers.get("content-type") || "";
        const ext = ct.includes("webp")
          ? "webp"
          : ct.includes("png")
            ? "png"
            : ct.includes("avif")
              ? "avif"
              : "jpg";
        const fileName = `${randomUUID()}.${ext}`;
        const buf = Buffer.from(await r.arrayBuffer());
        await writeFile(path.join(uploadDir, fileName), buf);
        downloaded.push(`/uploads/products/${target.brandSlug}/${fileName}`);
      } catch (e) {
        result.errors.push(
          `download ${url}: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }
    result.imagesUploaded = downloaded.length;
    if (downloaded.length === 0) {
      result.errors.push("다운로드 0건 — hotlink 모드로 폴백");
    } else {
      usableUrls = downloaded;
    }
  }

  result.imageUrls = usableUrls;

  if (opts.dryRun) return result;

  // DB 업데이트: 해당 brand의 placehold.co URL을 가진 상품 이미지 → 진짜 URL로 교체
  // brand는 slug로 찾되 못 찾으면 name 부분 매칭
  const brand = await prisma.brand.findFirst({
    where: {
      OR: [
        { slug: target.brandSlug },
        { name: { contains: target.brandName, mode: "insensitive" } },
      ],
    },
  });
  if (!brand) {
    result.errors.push(`brand row 없음: slug=${target.brandSlug}`);
    return result;
  }

  // 해당 brand의 placeholder 이미지(또는 isMain)를 가진 상품들
  const productsWithPlaceholder = await prisma.product.findMany({
    where: { brandId: brand.id },
    include: {
      images: {
        orderBy: [{ isMain: "desc" }, { sortOrder: "asc" }],
      },
    },
  });

  let updated = 0;
  for (let i = 0; i < productsWithPlaceholder.length; i++) {
    const product = productsWithPlaceholder[i];
    // 이미 진짜 이미지가 있으면 건너뜀 (사용자의 수동 매핑 보호)
    const hasReal = product.images.some(
      (img) =>
        !img.url.includes("placehold.co") && !img.url.includes("placeholder")
    );
    if (hasReal) continue;

    // 라운드로빈으로 brand 이미지 매핑
    const baseIdx = i * 3;
    const newUrls = [
      usableUrls[baseIdx % usableUrls.length],
      usableUrls[(baseIdx + 1) % usableUrls.length],
      usableUrls[(baseIdx + 2) % usableUrls.length],
    ].filter((v, idx, arr) => arr.indexOf(v) === idx); // 중복 제거 (이미지 풀이 작을 때)

    await prisma.$transaction(async (tx) => {
      // 기존 placeholder 이미지 삭제
      await tx.productImage.deleteMany({ where: { productId: product.id } });
      // 새 이미지 생성
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
  }

  result.productsUpdated = updated;
  return result;
}
