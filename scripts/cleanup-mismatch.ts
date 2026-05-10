/**
 * 카테고리 mismatch 자동 정리 스크립트.
 *
 * 의류성 product에 골프 장비/신발 이미지가 박힌 케이스 자동 감지/제거 +
 * 깔끔한 placeholder 교체.
 *
 * 실행: tsx scripts/cleanup-mismatch.ts
 *
 * 안전 가드:
 * - 30초 timeout (Promise.race)
 * - DB 연결 실패해도 exit 0 (next start 보장)
 * - PrismaPg adapter 사용 (Prisma 7.x 필수)
 * - background fork에서 실행되므로 어떤 에러도 사이트에 영향 X
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const APPAREL_NAME_RE =
  /(셔츠|블라우스|팬츠|바지|재킷|자켓|점퍼|코트|롱슬리브|반팔|긴팔|티셔츠|크롭|후드|후디|니트|스웨터|맨투맨|스웻|레깅스|브라|언더웨어|드레스|원피스|스커트|치마|오버롤|점프수트|sleeve|shirt|blouse|pant|jacket|coat|hoodie|tee|t\-?shirt|polo|crop|sweater|sweatshirt|legging|bra|underwear|dress|skirt|vest|top|outerwear|jumper|seamless|baselayer|tights)/i;

const GOLF_EQUIPMENT_URL_RE =
  /(driver|wedge|putter|iron|hybrid|fairway|headcover|head[-_ ]cover|golf[-_ ]?club|golf[-_ ]?bag|caddybag|caddy[-_ ]?bag|gloves?|tee[-_ ]?marker|ball[-_ ]?marker|_3w_|_5w_|_7w_|_d_\d|FW\d)/i;

const SHOES_NAME_RE =
  /(슈즈|운동화|스니커즈|러닝화|부츠|샌들|로퍼|shoes|sneaker|boot|sandal)/i;
// Nike 운동화 시리즈 + 일반 슈즈 패턴
const SHOES_URL_RE =
  /(shoes|sneaker|footwear|running[-_ ]?shoes|trail[-_ ]?running|GTX[-_ ]?\d+|jordan|kobe|airmax|air[-_ ]?max|airforce|air[-_ ]?force|dunk|sb[-_ ]?dunk|react|pegasus|vaporfly|metcon|cortez|blazer|huarache|free[-_ ]?run)/i;

// 마케팅/배너/hero 이미지 패턴 — product 이미지가 아닌 광고/홍보 이미지
const MARKETING_URL_RE =
  /(_HERO_?|HERO[-_ ]|BIS_alt|GNB[-_ ]|gnb_banner|storycard|story[-_ ]?card|main[-_ ]?banner|main[-_ ]?marketing|brand[-_ ]?banner|hero[-_ ]?banner|carousel|promotion|campaign|featured\.jpg|history|who[-_ ]?we[-_ ]?are|naked[-_ ]?yoga[-_ ]?book|mindful[-_ ]?movement[-_ ]?book)/i;

function placeholderForProduct(productName: string): string {
  const safe = productName.replace(/[^\w\s가-힣-]/g, "").slice(0, 24);
  return `https://placehold.co/800x1000/F5F5F5/9B9B9B?font=inter&text=${encodeURIComponent(
    safe
  )}`;
}

function createPrisma() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[cleanup-mismatch] DATABASE_URL not set");
    return null;
  }
  try {
    const adapter = new PrismaPg({ connectionString: url });
    return new PrismaClient({ adapter });
  } catch (e) {
    console.error("[cleanup-mismatch] Prisma init failed:", e);
    return null;
  }
}

async function run() {
  const prisma = createPrisma();
  if (!prisma) return;

  let totalChecked = 0;
  let totalCleaned = 0;
  let totalDeletedImages = 0;

  try {
    const products = await prisma.product.findMany({
      include: {
        images: { select: { id: true, url: true } },
      },
    });
    totalChecked = products.length;

    for (const product of products) {
      const isApparel = APPAREL_NAME_RE.test(product.name);
      const isShoes = SHOES_NAME_RE.test(product.name);

      const mismatched: string[] = [];
      for (const img of product.images) {
        // 의류 product인데 골프 장비 URL → mismatch
        if (isApparel && GOLF_EQUIPMENT_URL_RE.test(img.url)) {
          mismatched.push(img.url);
          continue;
        }
        // 의류 product인데 운동화/농구화 URL → mismatch (의류와 신발 분리)
        if (isApparel && !isShoes && SHOES_URL_RE.test(img.url)) {
          mismatched.push(img.url);
          continue;
        }
        // 의류 product인데 마케팅/hero 배너 URL → mismatch (제품 사진 아님)
        if (isApparel && MARKETING_URL_RE.test(img.url)) {
          mismatched.push(img.url);
          continue;
        }
      }

      if (mismatched.length === 0) continue;

      const ratio = mismatched.length / product.images.length;
      try {
        if (ratio < 0.5) {
          // 일부만 mismatch — 그 일부만 삭제
          const r = await prisma.productImage.deleteMany({
            where: {
              productId: product.id,
              url: { in: mismatched },
            },
          });
          totalDeletedImages += r.count;
          // 이미지 1개도 안 남으면 placeholder 추가
          const remaining = product.images.length - r.count;
          if (remaining === 0) {
            await prisma.productImage.create({
              data: {
                productId: product.id,
                url: placeholderForProduct(product.name),
                isMain: true,
                sortOrder: 0,
              },
            });
          }
        } else {
          // 50% 이상 mismatch — 전체 reset
          await prisma.$transaction(async (tx) => {
            const del = await tx.productImage.deleteMany({
              where: { productId: product.id },
            });
            totalDeletedImages += del.count;
            await tx.productImage.create({
              data: {
                productId: product.id,
                url: placeholderForProduct(product.name),
                isMain: true,
                sortOrder: 0,
              },
            });
          });
        }
        totalCleaned += 1;
      } catch (e) {
        console.error(
          `[cleanup-mismatch] product ${product.id} failed:`,
          e instanceof Error ? e.message : e
        );
      }
    }

    console.log(
      `[cleanup-mismatch] checked=${totalChecked} cleaned=${totalCleaned} deletedImages=${totalDeletedImages}`
    );
  } catch (e) {
    console.error("[cleanup-mismatch] FAILED:", e);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

// 30초 timeout — hang 나면 그냥 종료
const timeout = new Promise<void>((resolve) =>
  setTimeout(() => {
    console.error("[cleanup-mismatch] timeout 30s — exiting");
    resolve();
  }, 30_000)
);

Promise.race([run(), timeout])
  .catch((e) => {
    console.error("[cleanup-mismatch] outer catch:", e);
  })
  .finally(() => {
    process.exit(0);
  });
