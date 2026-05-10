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
  /(셔츠|블라우스|팬츠|바지|재킷|자켓|점퍼|코트|롱슬리브|반팔|긴팔|티셔츠|크롭|후드|후디|니트|스웨터|맨투맨|스웻|레깅스|브라|언더웨어|드레스|원피스|스커트|치마|오버롤|점프수트|sleeve|shirt|blouse|pant|jacket|coat|hoodie|tee|t\-?shirt|polo|crop|sweater|sweatshirt|legging|bra|underwear|dress|skirt|vest|top|outerwear|jumper|seamless|baselayer|tights|color[-_ ]?blocked|collar|long[-_ ]?sleeve|short[-_ ]?sleeve)/i;

/**
 * 의류 product 이미지로 받아들일 수 있는 URL 키워드 화이트리스트.
 * 의류 product인데 이미지 URL에 이 중 하나도 없으면 의심 → mismatch.
 *
 * 매우 공격적인 휴리스틱이지만 false positive 감수하고 mismatch 100% 제거 우선.
 */
const APPAREL_URL_ALLOWED_RE =
  /(shirt|blouse|pant|jacket|coat|hoodie|hood|tee|t\-?shirt|polo|crop|sweater|sweatshirt|legging|bra|underwear|dress|skirt|vest|outer|jumper|seamless|baselayer|tights|tops?|bottoms?|apparel|clothing|wear|cloth|fabric|knit|denim|chino|cargo|trouser|shorts|jean|cardigan|fleece|parka|windbreaker|anorak|gilet|sweatpant|jogger|tank|cami|robe|romper|coverall|jumpsuit|primary|featured|model[-_ ]?wear|product[-_ ]?\d|p\d{4}|nv\d{4}|wbw\d|w\d{4}r|s\d{6}|w26\d|s26\d|men[-_ ]?wear|women[-_ ]?wear|men[-_ ]?apparel|women[-_ ]?apparel)/i;

const GOLF_EQUIPMENT_URL_RE =
  /(driver|wedge|putter|iron|hybrid|fairway|headcover|head[-_ ]cover|golf[-_ ]?club|golf[-_ ]?bag|caddybag|caddy[-_ ]?bag|gloves?|tee[-_ ]?marker|ball[-_ ]?marker|_3w_|_5w_|_7w_|_d_\d|FW\d|gen[-_ ]?\d|gen\d|0311|0341|0341X|black[-_ ]?ops|sugar[-_ ]?daddy|drone|spitfire|deadly[-_ ]?fierce|club[-_ ]?head|shaft|grip|putter[-_ ]?cover|club[-_ ]?cover)/i;

const SHOES_NAME_RE =
  /(슈즈|운동화|스니커즈|러닝화|부츠|샌들|로퍼|shoes|sneaker|boot|sandal)/i;
const SHOES_URL_RE =
  /(shoes|sneaker|footwear|running[-_ ]?shoes|trail[-_ ]?running|GTX[-_ ]?\d+|jordan|kobe|airmax|air[-_ ]?max|airforce|air[-_ ]?force|dunk|sb[-_ ]?dunk|react|pegasus|vaporfly|metcon|cortez|blazer|huarache|free[-_ ]?run)/i;

const MARKETING_URL_RE =
  /(_HERO_?|HERO[-_ ]|BIS_alt|GNB[-_ ]|gnb_banner|storycard|story[-_ ]?card|main[-_ ]?banner|main[-_ ]?marketing|brand[-_ ]?banner|hero[-_ ]?banner|carousel|promotion|campaign|featured\.jpg|^.*history.*\.png|who[-_ ]?we[-_ ]?are|naked[-_ ]?yoga[-_ ]?book|mindful[-_ ]?movement[-_ ]?book)/i;

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
        const url = img.url;

        // placehold.co는 의도된 placeholder라 keep
        if (/placehold\.co|placeholder/i.test(url)) continue;

        // 의류 product 한정 검사
        if (!isApparel) continue;

        // 의류 product인데 골프 장비 URL → mismatch
        if (GOLF_EQUIPMENT_URL_RE.test(url)) {
          mismatched.push(url);
          continue;
        }
        // 의류 product인데 운동화/농구화 URL → mismatch
        if (!isShoes && SHOES_URL_RE.test(url)) {
          mismatched.push(url);
          continue;
        }
        // 의류 product인데 마케팅/hero 배너 URL → mismatch
        if (MARKETING_URL_RE.test(url)) {
          mismatched.push(url);
          continue;
        }
        // 의류 화이트리스트: URL에 의류성 키워드가 1개도 없으면 의심 → mismatch
        // (false positive 가능성 있지만 mismatch 100% 제거 우선)
        if (!APPAREL_URL_ALLOWED_RE.test(url)) {
          mismatched.push(url);
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
