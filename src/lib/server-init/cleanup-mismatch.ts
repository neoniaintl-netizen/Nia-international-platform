/**
 * server start 시점 자동 cleanup.
 *
 * 모든 product의 카테고리 type을 분류하고, image URL이 그 type의 화이트리스트와
 * 매칭되지 않으면 mismatch로 잡아 placeholder 또는 brand 풀 이미지로 교체.
 *
 * - Next.js instrumentation hook에서 호출됨
 * - 30초 hard timeout
 * - 멱등성: placeholder URL은 keep
 */

import { prisma } from "@/lib/db";
import {
  STATIC_BRAND_IMAGES,
  STATIC_BRAND_IMAGES_BY_TYPE,
} from "@/lib/static-brand-images";
import { classifyProductType, type ProductType } from "./product-type";
import { classifyImageUrl, isPlaceholderUrl } from "./url-classifier";

function placeholderForProduct(productName: string): string {
  // NKBUS 톤: 진한 챠콜 배경 + 깨끗한 흰색 텍스트
  const safe = productName.replace(/[^\w\s가-힣-]/g, "").slice(0, 30);
  return `https://placehold.co/800x1000/2A2A2A/FFFFFF?font=inter&text=${encodeURIComponent(
    safe
  )}`;
}

let alreadyRan = false;

/**
 * type-aware brand 풀에서 라운드로빈으로 N개 URL 선택.
 * BY_TYPE 풀에 type별 데이터 없으면 legacy STATIC_BRAND_IMAGES (단일 풀) fallback.
 */
function pickPoolUrls(
  brandSlug: string | null,
  type: ProductType,
  productId: string,
  count: number
): string[] {
  if (!brandSlug) return [];
  const byType = STATIC_BRAND_IMAGES_BY_TYPE[brandSlug];
  let pool: string[] | undefined = byType ? byType[type] : undefined;

  // type 풀 없으면 legacy 단일 풀 사용 (의류류 type만, 골프 장비 등에는 부적합)
  if (!pool || pool.length === 0) {
    if (
      type === "APPAREL_TOP" ||
      type === "APPAREL_BOTTOM" ||
      type === "APPAREL_OUTER" ||
      type === "APPAREL_DRESS" ||
      type === "GOLF_APPAREL"
    ) {
      pool = STATIC_BRAND_IMAGES[brandSlug];
    }
  }

  if (!pool || pool.length === 0) return [];

  const idx = Math.abs(hashString(productId)) % pool.length;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const u = pool[(idx + i) % pool.length];
    if (!out.includes(u)) out.push(u);
    if (out.length >= count) break;
  }
  return out;
}

async function doCleanup() {
  let totalChecked = 0;
  let totalSkipped = 0;
  let totalCleaned = 0;
  let totalDeletedImages = 0;
  let totalReplacedFromPool = 0;
  const verdictCounts = {
    placeholder: 0,
    unrelated: 0,
    forbidden: 0,
    "no-keyword": 0,
    ok: 0,
  };

  const products = await prisma.product.findMany({
    include: {
      images: { select: { id: true, url: true } },
      brand: { select: { slug: true, name: true } },
      category: { select: { slug: true } },
    },
  });
  totalChecked = products.length;

  for (const product of products) {
    const brandSlug = product.brand?.slug ?? null;
    const categorySlug = product.category?.slug ?? null;
    const type = classifyProductType(product.name, brandSlug, categorySlug);

    if (type === "UNKNOWN") {
      totalSkipped += 1;
      continue;
    }

    // 0) placeholder만 가진 product → brand 풀(type별)에서 진짜 이미지로 교체
    const allPlaceholder =
      product.images.length > 0 &&
      product.images.every((img) => isPlaceholderUrl(img.url));
    if (allPlaceholder) {
      const newUrls = pickPoolUrls(brandSlug, type, product.id, 3);
      if (newUrls.length > 0) {
        try {
          await prisma.$transaction(async (tx) => {
            await tx.productImage.deleteMany({
              where: { productId: product.id },
            });
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
          totalReplacedFromPool += 1;
        } catch (e) {
          console.error(
            `[server-init/cleanup] pool replace product ${product.id}:`,
            e instanceof Error ? e.message : e
          );
        }
        continue;
      }
      // 풀 비어있고 이미지가 모두 placeholder면 — 1개만 새 챠콜 디자인으로 정리
      if (product.images.length > 1) {
        try {
          await prisma.$transaction(async (tx) => {
            await tx.productImage.deleteMany({
              where: { productId: product.id },
            });
            await tx.productImage.create({
              data: {
                productId: product.id,
                url: placeholderForProduct(product.name),
                isMain: true,
                sortOrder: 0,
              },
            });
          });
          totalCleaned += 1;
        } catch {}
      } else if (product.images.length === 1) {
        // 흐린 회색 placeholder는 챠콜로 갱신
        const img = product.images[0];
        if (/placehold\.co\/.*F5F5F5\/9B9B9B/.test(img.url)) {
          try {
            await prisma.productImage.update({
              where: { id: img.id },
              data: { url: placeholderForProduct(product.name) },
            });
          } catch {}
        }
      }
      continue;
    }

    // 1) 이미지별 mismatch 검출
    const mismatched: string[] = [];
    for (const img of product.images) {
      const verdict = classifyImageUrl(img.url, type);
      verdictCounts[verdict] += 1;
      if (verdict === "ok" || verdict === "placeholder") continue;
      mismatched.push(img.url);
    }

    if (mismatched.length === 0) continue;

    const ratio = mismatched.length / product.images.length;
    try {
      if (ratio >= 0.5) {
        // 50% 이상 mismatch → 전체 reset 후 brand 풀(type별)에서 매핑 또는 placeholder
        const newUrls = pickPoolUrls(brandSlug, type, product.id, 3);
        await prisma.$transaction(async (tx) => {
          const del = await tx.productImage.deleteMany({
            where: { productId: product.id },
          });
          totalDeletedImages += del.count;
          if (newUrls.length > 0) {
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
          } else {
            await tx.productImage.create({
              data: {
                productId: product.id,
                url: placeholderForProduct(product.name),
                isMain: true,
                sortOrder: 0,
              },
            });
          }
        });
        if (newUrls.length > 0) totalReplacedFromPool += 1;
        else totalCleaned += 1;
      } else {
        // 일부만 mismatch — 그 일부만 삭제
        const r = await prisma.productImage.deleteMany({
          where: { productId: product.id, url: { in: mismatched } },
        });
        totalDeletedImages += r.count;
        const remaining = product.images.length - r.count;
        if (remaining === 0) {
          // 가능하면 풀에서 채우고 아니면 placeholder
          const newUrls = pickPoolUrls(brandSlug, type, product.id, 1);
          await prisma.productImage.create({
            data: {
              productId: product.id,
              url: newUrls[0] ?? placeholderForProduct(product.name),
              isMain: true,
              sortOrder: 0,
            },
          });
        }
        totalCleaned += 1;
      }
    } catch (e) {
      console.error(
        `[server-init/cleanup] product ${product.id} failed:`,
        e instanceof Error ? e.message : e
      );
    }
  }

  console.log(
    `[server-init/cleanup] checked=${totalChecked} skippedUnknown=${totalSkipped} cleaned=${totalCleaned} deletedImages=${totalDeletedImages} replacedFromPool=${totalReplacedFromPool} ` +
      `verdicts=ok:${verdictCounts.ok} placeholder:${verdictCounts.placeholder} unrelated:${verdictCounts.unrelated} forbidden:${verdictCounts.forbidden} no-keyword:${verdictCounts["no-keyword"]}`
  );
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

export async function runCleanup(): Promise<void> {
  // CLEANUP_FORCE_RERUN=1이면 alreadyRan 무시
  const forceRerun = process.env.CLEANUP_FORCE_RERUN === "1";
  if (alreadyRan && !forceRerun) return;
  alreadyRan = true;

  if (!process.env.DATABASE_URL) {
    console.log("[server-init/cleanup] DATABASE_URL not set, skipping");
    return;
  }

  const timeout = new Promise<void>((resolve) =>
    setTimeout(() => {
      console.error("[server-init/cleanup] timeout 30s, exit");
      resolve();
    }, 30_000)
  );

  try {
    await Promise.race([doCleanup(), timeout]);
  } catch (e) {
    console.error("[server-init/cleanup] outer catch:", e);
  }
}
