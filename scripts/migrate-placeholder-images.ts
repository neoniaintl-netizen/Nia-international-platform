/**
 * placehold.co placeholder 이미지를 가진 상품들을
 * static-brand-images.ts의 진짜 brand 이미지로 일괄 교체.
 *
 * 실행 시점: start 스크립트에서 매 컨테이너 시작 시.
 * 멱등성: 이미 진짜 이미지가 있는 상품은 건너뜀.
 *
 * 실행: tsx scripts/migrate-placeholder-images.ts
 *
 * DB 연결 실패해도 next start는 진행해야 하므로, 에러는 console.error로만 출력하고 종료 0.
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { STATIC_BRAND_IMAGES } from "../src/lib/static-brand-images";

function createPrisma() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[migrate-images] DATABASE_URL not set, skipping");
    return null;
  }
  try {
    const adapter = new PrismaPg({ connectionString: url });
    return new PrismaClient({ adapter });
  } catch (e) {
    console.error("[migrate-images] PrismaClient init failed:", e);
    return null;
  }
}

async function main() {
  const prisma = createPrisma();
  if (!prisma) return; // exit 0 — next start 진행

  let totalUpdated = 0;
  const summary: Record<string, { updated: number; skipped: number; reason?: string }> = {};

  for (const [brandSlug, imageUrls] of Object.entries(STATIC_BRAND_IMAGES)) {
    if (imageUrls.length === 0) {
      summary[brandSlug] = { updated: 0, skipped: 0, reason: "empty image pool" };
      continue;
    }

    // brand 찾기 (slug 우선, 없으면 name 부분 매칭)
    const brand = await prisma.brand.findFirst({
      where: {
        OR: [
          { slug: brandSlug },
          { slug: brandSlug.replace("-", "") },
          { name: { contains: brandSlug, mode: "insensitive" } },
        ],
      },
    });
    if (!brand) {
      summary[brandSlug] = { updated: 0, skipped: 0, reason: "brand not found" };
      continue;
    }

    // 이 brand의 상품들 + 이미지 가져오기
    const products = await prisma.product.findMany({
      where: { brandId: brand.id },
      include: { images: true },
    });

    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      // 이미 진짜 이미지가 있는 상품은 건너뜀 (수동 매핑 보호)
      const hasReal = product.images.some(
        (img) =>
          !img.url.includes("placehold.co") &&
          !img.url.includes("placeholder")
      );
      if (hasReal && product.images.length > 0) {
        skipped += 1;
        continue;
      }

      // 라운드로빈으로 brand 이미지 매핑
      const baseIdx = i * 3;
      const newUrls = [
        imageUrls[baseIdx % imageUrls.length],
        imageUrls[(baseIdx + 1) % imageUrls.length],
        imageUrls[(baseIdx + 2) % imageUrls.length],
      ].filter((v, idx, arr) => arr.indexOf(v) === idx); // 풀 작을 때 중복 제거

      try {
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
      } catch (e) {
        console.error(
          `[migrate-images] product ${product.id} update failed:`,
          e instanceof Error ? e.message : e
        );
      }
    }

    summary[brandSlug] = { updated, skipped };
    totalUpdated += updated;
  }

  console.log(
    "[migrate-images] summary:",
    JSON.stringify(summary, null, 2),
    "totalUpdated:",
    totalUpdated
  );
}

main()
  .catch((e) => {
    console.error("[migrate-images] FAILED (non-fatal):", e);
  })
  .finally(() => {
    // 에러 여부와 관계없이 next start 진행 — exit 0
    process.exit(0);
  });
