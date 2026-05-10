/**
 * server start 시점 자동 cleanup.
 *
 * 의류 product에 박힌 mismatch 이미지(골프 클럽/운동화/hero/마케팅 배너 등)를
 * 자동 감지 + placeholder로 교체.
 *
 * - Next.js instrumentation hook에서 호출됨
 * - 빌드 시점에 Next가 컴파일하므로 prisma/cheerio 등 server-side 모듈 안전 사용
 * - 멱등성: 이미 처리된 상품은 변경 없음 (placehold.co URL은 keep)
 * - 30초 hard timeout
 */

import { prisma } from "@/lib/db";

const APPAREL_NAME_RE =
  /(셔츠|블라우스|팬츠|바지|재킷|자켓|점퍼|코트|롱슬리브|반팔|긴팔|티셔츠|크롭|후드|후디|니트|스웨터|맨투맨|스웻|레깅스|브라|언더웨어|드레스|원피스|스커트|치마|오버롤|점프수트|sleeve|shirt|blouse|pant|jacket|coat|hoodie|tee|t\-?shirt|polo|crop|sweater|sweatshirt|legging|bra|underwear|dress|skirt|vest|top|outerwear|jumper|seamless|baselayer|tights|color[-_ ]?blocked|collar|long[-_ ]?sleeve|short[-_ ]?sleeve)/i;

const APPAREL_URL_ALLOWED_RE =
  /(shirt|blouse|pant|jacket|coat|hoodie|hood|tee|t\-?shirt|polo|crop|sweater|sweatshirt|legging|bra|underwear|dress|skirt|vest|outer|jumper|seamless|baselayer|tights|tops?|bottoms?|apparel|clothing|wear|cloth|fabric|knit|denim|chino|cargo|trouser|shorts|jean|cardigan|fleece|parka|windbreaker|anorak|gilet|sweatpant|jogger|tank|cami|robe|romper|coverall|jumpsuit|primary|featured|model[-_ ]?wear|product[-_ ]?\d|p\d{4}|nv\d{4}|wbw\d|w\d{4}r|s\d{6}|w26\d|s26\d|men[-_ ]?wear|women[-_ ]?wear|men[-_ ]?apparel|women[-_ ]?apparel)/i;

const GOLF_EQUIPMENT_URL_RE =
  /(driver|wedge|putter|iron|hybrid|fairway|headcover|head[-_ ]cover|golf[-_ ]?club|golf[-_ ]?bag|caddybag|caddy[-_ ]?bag|gloves?|tee[-_ ]?marker|ball[-_ ]?marker|_3w_|_5w_|_7w_|_d_\d|FW\d|gen[-_ ]?\d|gen\d|0311|0341|0341X|black[-_ ]?ops|sugar[-_ ]?daddy|drone|spitfire|deadly[-_ ]?fierce|club[-_ ]?head|shaft|grip|putter[-_ ]?cover|club[-_ ]?cover)/i;

const SHOES_NAME_RE =
  /(슈즈|운동화|스니커즈|러닝화|부츠|샌들|로퍼|shoes|sneaker|boot|sandal)/i;
const SHOES_URL_RE =
  /(shoes|sneaker|footwear|running[-_ ]?shoes|trail[-_ ]?running|GTX[-_ ]?\d+|jordan|kobe|airmax|air[-_ ]?max|airforce|air[-_ ]?force|dunk|sb[-_ ]?dunk|react|pegasus|vaporfly|metcon|cortez|blazer|huarache|free[-_ ]?run)/i;

const MARKETING_URL_RE =
  /(_HERO_?|HERO[-_ ]|BIS_alt|GNB[-_ ]|gnb_banner|storycard|story[-_ ]?card|main[-_ ]?banner|main[-_ ]?marketing|brand[-_ ]?banner|hero[-_ ]?banner|carousel|promotion|campaign|featured\.jpg|history|who[-_ ]?we[-_ ]?are|naked[-_ ]?yoga[-_ ]?book|mindful[-_ ]?movement[-_ ]?book)/i;

function placeholderForProduct(productName: string): string {
  const safe = productName.replace(/[^\w\s가-힣-]/g, "").slice(0, 24);
  return `https://placehold.co/800x1000/F5F5F5/9B9B9B?font=inter&text=${encodeURIComponent(
    safe
  )}`;
}

// 이미 한 번 실행했으면 다시 안 돌도록 메모리 가드
let alreadyRan = false;

async function doCleanup() {
  let totalChecked = 0;
  let totalCleaned = 0;
  let totalDeletedImages = 0;

  const products = await prisma.product.findMany({
    include: { images: { select: { id: true, url: true } } },
  });
  totalChecked = products.length;

  for (const product of products) {
    const isApparel = APPAREL_NAME_RE.test(product.name);
    const isShoes = SHOES_NAME_RE.test(product.name);

    const mismatched: string[] = [];
    for (const img of product.images) {
      const url = img.url;
      if (/placehold\.co|placeholder/i.test(url)) continue;
      if (!isApparel) continue;

      if (GOLF_EQUIPMENT_URL_RE.test(url)) {
        mismatched.push(url);
        continue;
      }
      if (!isShoes && SHOES_URL_RE.test(url)) {
        mismatched.push(url);
        continue;
      }
      if (MARKETING_URL_RE.test(url)) {
        mismatched.push(url);
        continue;
      }
      if (!APPAREL_URL_ALLOWED_RE.test(url)) {
        mismatched.push(url);
        continue;
      }
    }

    if (mismatched.length === 0) continue;

    const ratio = mismatched.length / product.images.length;
    try {
      if (ratio < 0.5) {
        const r = await prisma.productImage.deleteMany({
          where: { productId: product.id, url: { in: mismatched } },
        });
        totalDeletedImages += r.count;
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
        `[server-init/cleanup] product ${product.id} failed:`,
        e instanceof Error ? e.message : e
      );
    }
  }

  console.log(
    `[server-init/cleanup] checked=${totalChecked} cleaned=${totalCleaned} deletedImages=${totalDeletedImages}`
  );
}

export async function runCleanup(): Promise<void> {
  if (alreadyRan) return;
  alreadyRan = true;

  // DATABASE_URL 미설정 환경(로컬 build 등)에서는 skip
  if (!process.env.DATABASE_URL) {
    console.log("[server-init/cleanup] DATABASE_URL not set, skipping");
    return;
  }

  // 30초 timeout
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
