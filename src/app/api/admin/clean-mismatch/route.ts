import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const BodySchema = z
  .object({
    dryRun: z.boolean().optional().default(true),
  })
  .strict();

/**
 * 의류성 product 이름 키워드 (한글/영어).
 * 매칭되면 "이건 의류 상품" 으로 간주.
 */
const APPAREL_NAME_RE =
  /(셔츠|블라우스|팬츠|바지|재킷|자켓|점퍼|코트|롱슬리브|반팔|긴팔|티셔츠|크롭|후드|후디|니트|스웨터|맨투맨|스웻|레깅스|브라|언더웨어|드레스|원피스|스커트|치마|오버롤|점프수트|sleeve|shirt|blouse|pant|jacket|coat|hoodie|tee|t\-?shirt|polo|crop|sweater|sweatshirt|legging|bra|underwear|dress|skirt|vest|top|outerwear|jumper|seamless|baselayer|tights|color[-_ ]?blocked|collar|long[-_ ]?sleeve|short[-_ ]?sleeve)/i;

/**
 * 의류 product 이미지 URL 화이트리스트.
 * 의류 product인데 1개도 매칭 안 되면 의심 → mismatch.
 */
const APPAREL_URL_ALLOWED_RE =
  /(shirt|blouse|pant|jacket|coat|hoodie|hood|tee|t\-?shirt|polo|crop|sweater|sweatshirt|legging|bra|underwear|dress|skirt|vest|outer|jumper|seamless|baselayer|tights|tops?|bottoms?|apparel|clothing|wear|cloth|fabric|knit|denim|chino|cargo|trouser|shorts|jean|cardigan|fleece|parka|windbreaker|anorak|gilet|sweatpant|jogger|tank|cami|robe|romper|coverall|jumpsuit|primary|featured|model[-_ ]?wear|product[-_ ]?\d|p\d{4}|nv\d{4}|wbw\d|w\d{4}r|s\d{6}|w26\d|s26\d|men[-_ ]?wear|women[-_ ]?wear|men[-_ ]?apparel|women[-_ ]?apparel)/i;

const GOLF_EQUIPMENT_URL_RE =
  /(driver|wedge|putter|iron|hybrid|fairway|headcover|head[-_ ]cover|golf[-_ ]?club|golf[-_ ]?bag|caddybag|caddy[-_ ]?bag|gloves?|tee[-_ ]?marker|ball[-_ ]?marker|_3w_|_5w_|_7w_|_d_\d|FW\d|gen[-_ ]?\d|gen\d|0311|0341|0341X|black[-_ ]?ops|sugar[-_ ]?daddy|drone|spitfire|deadly[-_ ]?fierce|club[-_ ]?head|shaft|grip|putter[-_ ]?cover|club[-_ ]?cover)/i;

const SHOES_NAME_RE = /(슈즈|운동화|스니커즈|러닝화|부츠|샌들|로퍼|shoes|sneaker|boot|sandal)/i;
const SHOES_URL_RE =
  /(shoes|sneaker|footwear|running[-_ ]?shoes|trail[-_ ]?running|GTX[-_ ]?\d+|jordan|kobe|airmax|air[-_ ]?max|airforce|air[-_ ]?force|dunk|sb[-_ ]?dunk|react|pegasus|vaporfly|metcon|cortez|blazer|huarache|free[-_ ]?run)/i;

const MARKETING_URL_RE =
  /(_HERO_?|HERO[-_ ]|BIS_alt|GNB[-_ ]|gnb_banner|storycard|story[-_ ]?card|main[-_ ]?banner|main[-_ ]?marketing|brand[-_ ]?banner|hero[-_ ]?banner|carousel|promotion|campaign|featured\.jpg|history|who[-_ ]?we[-_ ]?are|naked[-_ ]?yoga[-_ ]?book|mindful[-_ ]?movement[-_ ]?book)/i;

function placeholderForProduct(productName: string): string {
  // NKBUS 톤: 진한 챠콜 배경 + 깨끗한 흰색 텍스트
  const safe = productName.replace(/[^\w\s가-힣-]/g, "").slice(0, 30);
  return `https://placehold.co/800x1000/2A2A2A/FFFFFF?font=inter&text=${encodeURIComponent(safe)}`;
}

/**
 * POST /api/admin/clean-mismatch
 *
 * 카테고리/이름과 이미지 URL의 mismatch 자동 감지 + 정리.
 *
 * 케이스:
 * 1. 의류 product (이름에 셔츠/팬츠/재킷 등) + 이미지에 골프 장비 키워드(driver/iron/wedge 등)
 *    → 해당 이미지 모두 삭제 후 깔끔한 placeholder로 교체
 * 2. (반대 경우) 골프 장비 product에 의류 이미지 — 검출 어려워 패스
 *
 * 처리 후 운영자가 어드민 상품 관리에서 진짜 이미지 수동 등록 가능.
 */
export async function POST(req: NextRequest) {
  // 인증: ADMIN 세션 OR `x-cleanup-token` 헤더가 ADMIN_SETUP_TOKEN env와 일치
  // 후자는 부트스트랩/긴급 정리용 우회. Railway에 토큰 임시 설정 → 호출 → 토큰 제거.
  const cleanupToken = req.headers.get("x-cleanup-token");
  const expectedToken = process.env.ADMIN_SETUP_TOKEN;
  const tokenAuth =
    cleanupToken && expectedToken && cleanupToken === expectedToken;

  if (!tokenAuth) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;
  }

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
  const { dryRun } = parsed.data;

  const products = await prisma.product.findMany({
    include: {
      images: { select: { id: true, url: true } },
      brand: { select: { name: true, slug: true } },
    },
  });

  type Hit = {
    productId: string;
    productName: string;
    brandSlug: string | null;
    isApparel: boolean;
    isShoes: boolean;
    mismatchedImages: string[];
    cleaned?: boolean;
  };
  const hits: Hit[] = [];

  for (const product of products) {
    const isApparel = APPAREL_NAME_RE.test(product.name);
    const isShoes = SHOES_NAME_RE.test(product.name);

    // 어떤 이미지가 mismatch인지 판정
    const mismatched: string[] = [];
    for (const img of product.images) {
      const url = img.url;
      // placehold.co는 의도된 placeholder라 keep
      if (/placehold\.co|placeholder/i.test(url)) continue;
      // 의류 product 한정 검사
      if (!isApparel) continue;
      // 1) 의류인데 골프 장비 URL → mismatch
      if (GOLF_EQUIPMENT_URL_RE.test(url)) {
        mismatched.push(url);
        continue;
      }
      // 2) 의류인데 운동화/농구화 URL → mismatch
      if (!isShoes && SHOES_URL_RE.test(url)) {
        mismatched.push(url);
        continue;
      }
      // 3) 의류인데 마케팅/hero 배너 URL → mismatch
      if (MARKETING_URL_RE.test(url)) {
        mismatched.push(url);
        continue;
      }
      // 4) 의류인데 의류성 키워드가 1개도 없음 → mismatch (공격적 휴리스틱)
      if (!APPAREL_URL_ALLOWED_RE.test(url)) {
        mismatched.push(url);
        continue;
      }
    }

    if (mismatched.length === 0) continue;
    // 모든 이미지가 mismatch가 아니라 일부만이면, 그 일부만 삭제할 수도 있는데
    // 결국 풀 일관성을 위해 모두 placeholder로 reset.
    // (mismatch 비율이 50% 이상이면 전체 reset)
    const ratio = mismatched.length / product.images.length;
    if (ratio < 0.5) {
      // 일부만 mismatch — 그 일부만 삭제
      hits.push({
        productId: product.id,
        productName: product.name,
        brandSlug: product.brand?.slug ?? null,
        isApparel,
        isShoes,
        mismatchedImages: mismatched,
      });
      if (!dryRun) {
        await prisma.productImage.deleteMany({
          where: {
            productId: product.id,
            url: { in: mismatched },
          },
        });
        // 이미지 1개도 안 남으면 placeholder 추가
        const remaining = product.images.length - mismatched.length;
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
        hits[hits.length - 1].cleaned = true;
      }
    } else {
      // 50% 이상 mismatch — 전체 reset
      hits.push({
        productId: product.id,
        productName: product.name,
        brandSlug: product.brand?.slug ?? null,
        isApparel,
        isShoes,
        mismatchedImages: mismatched,
      });
      if (!dryRun) {
        await prisma.$transaction(async (tx) => {
          await tx.productImage.deleteMany({ where: { productId: product.id } });
          await tx.productImage.create({
            data: {
              productId: product.id,
              url: placeholderForProduct(product.name),
              isMain: true,
              sortOrder: 0,
            },
          });
        });
        hits[hits.length - 1].cleaned = true;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    summary: {
      totalProducts: products.length,
      mismatchProducts: hits.length,
      cleaned: hits.filter((h) => h.cleaned).length,
    },
    hits: hits.slice(0, 50), // 응답 크기 제한
  });
}
