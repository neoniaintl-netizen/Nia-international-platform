import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import golfData from "@/lib/seed-data/golf-products.json";

export const runtime = "nodejs";
export const maxDuration = 300;

const BodySchema = z
  .object({
    dryRun: z.boolean().optional().default(true),
    /** 기존 product 모두 삭제 여부 (true면 wipe + seed, false면 seed만) */
    wipe: z.boolean().optional().default(true),
    /** 특정 brand만 처리 (생략 시 전체) */
    brandSlug: z.string().optional(),
  })
  .strict();

/**
 * 추출 데이터 brand 키 → DB Brand.slug 매핑.
 * golf-category-map.ts와 일치.
 */
const BRAND_SLUG_MAP: Record<string, string> = {
  markandlona: "mark-lona",
  anew: "anewgolf",
  descentegolf: "descente-golf",
  iceberg: "iceberg-golf",
  // 나머지는 그대로 (utaa, pelt, gfore, thecart, southcape, pxg)
};

/** type → 카테고리 슬러그 매핑 */
const TYPE_TO_CATEGORY: Record<string, string> = {
  APPAREL_TOP: "golf-top",
  APPAREL_BOTTOM: "golf-bottom",
  APPAREL_OUTER: "golf-outer",
  APPAREL_DRESS: "golf-bottom",
  UNDERWEAR: "golf-acc",
  SHOES: "golf-shoes",
  GOLF_SHOES: "golf-shoes",
  HEADWEAR: "golf-cap",
  BAG: "golf-bag",
  GOLF_BAG: "golf-bag",
  ACCESSORY: "golf-acc",
  GOLF_EQUIPMENT: "golf-club",
  BEAUTY: "golf-acc",
  UNKNOWN: "golf-acc",
};

/** brandSlug → 한글 brand 이름 (DB Brand 생성 시 사용) */
const BRAND_NAMES: Record<string, { name: string; nameKo: string }> = {
  "mark-lona": { name: "Mark & Lona", nameKo: "마크앤로나" },
  southcape: { name: "South Cape", nameKo: "사우스케이프" },
  anewgolf: { name: "ANEW", nameKo: "어뉴골프" },
  "iceberg-golf": { name: "Iceberg Golf", nameKo: "아이스버그골프" },
  utaa: { name: "UTAA", nameKo: "유타" },
  pelt: { name: "PELT", nameKo: "펠트" },
  gfore: { name: "G/FORE", nameKo: "지포어" },
  thecart: { name: "THE CART", nameKo: "더카트" },
  "descente-golf": { name: "Descente Golf", nameKo: "데상트골프" },
  pxg: { name: "PXG", nameKo: "피엑스지" },
  // 추출 안 됐지만 신규 brand
  waacgolf: { name: "WAAC", nameKo: "왁골프" },
  thecart_: { name: "THE CART", nameKo: "더카트" },
  bucketstore: { name: "Bucket Store", nameKo: "버킷스토어" },
  malbon: { name: "Malbon", nameKo: "말본골프" },
  amazingcre: { name: "Amazing Cre", nameKo: "어메이징크리" },
  langvan: { name: "Lanvin Blanc", nameKo: "랑방블랑" },
  saintandrews: { name: "St Andrews", nameKo: "세인트앤드류스" },
  masterbunny: { name: "Master Bunny", nameKo: "마스터바니에디션" },
  pearlygates: { name: "Pearly Gates", nameKo: "파리게이츠" },
  footjoy: { name: "FootJoy", nameKo: "풋조이" },
  bossgolf: { name: "BOSS Golf", nameKo: "보스골프" },
  titleist: { name: "Titleist", nameKo: "타이틀리스트" },
  nikegolf: { name: "Nike Golf", nameKo: "나이키 골프" },
};

interface SeedProduct {
  name: string;
  sourceUrl: string;
  imageUrl: string;
  type: string;
  price?: number;
  compareAt?: number;
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function fallbackPriceForType(type: string): number {
  // 추출 데이터에 price 없을 때 기본 가격 (사용자 어드민에서 수정 권장)
  switch (type) {
    case "APPAREL_TOP":
      return 159000;
    case "APPAREL_BOTTOM":
      return 199000;
    case "APPAREL_OUTER":
      return 359000;
    case "APPAREL_DRESS":
      return 229000;
    case "SHOES":
    case "GOLF_SHOES":
      return 289000;
    case "HEADWEAR":
      return 79000;
    case "BAG":
      return 159000;
    case "GOLF_BAG":
      return 690000;
    case "ACCESSORY":
      return 49000;
    case "GOLF_EQUIPMENT":
      return 590000;
    case "UNDERWEAR":
      return 89000;
    default:
      return 99000;
  }
}

export async function POST(req: NextRequest) {
  // 인증: ADMIN 세션 OR x-cleanup-token 헤더 (ADMIN_SETUP_TOKEN env)
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
  const { dryRun, wipe, brandSlug } = parsed.data;

  const data = golfData as Record<string, SeedProduct[]>;
  const allItems: Array<{ extractedBrandKey: string; item: SeedProduct }> = [];
  for (const [extractedKey, items] of Object.entries(data)) {
    if (brandSlug) {
      const dbSlug = BRAND_SLUG_MAP[extractedKey] ?? extractedKey;
      if (dbSlug !== brandSlug && extractedKey !== brandSlug) continue;
    }
    for (const item of items) allItems.push({ extractedBrandKey: extractedKey, item });
  }

  const summary = {
    totalToSeed: allItems.length,
    productsDeleted: 0,
    brandsCreated: 0,
    categoriesCreated: 0,
    productsCreated: 0,
    productImagesCreated: 0,
    errors: [] as string[],
  };

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      wipe,
      summary,
      sample: allItems.slice(0, 5).map(({ extractedBrandKey, item }) => ({
        brand: BRAND_SLUG_MAP[extractedBrandKey] ?? extractedBrandKey,
        type: item.type,
        category: TYPE_TO_CATEGORY[item.type] ?? "golf-acc",
        name: item.name,
        imageUrl: item.imageUrl,
      })),
    });
  }

  // ===== 실제 적용 =====

  // 1. (옵션) 기존 모든 product 삭제 — Brand/Category는 보존
  if (wipe && !brandSlug) {
    try {
      // ProductImage는 Cascade로 자동 삭제
      const del = await prisma.product.deleteMany({});
      summary.productsDeleted = del.count;
    } catch (e) {
      summary.errors.push(
        `wipe: ${e instanceof Error ? e.message : String(e)}`
      );
      return NextResponse.json({ ok: false, summary }, { status: 500 });
    }
  } else if (wipe && brandSlug) {
    // 특정 brand만 wipe
    const dbBrand = await prisma.brand.findUnique({
      where: { slug: brandSlug },
    });
    if (dbBrand) {
      const del = await prisma.product.deleteMany({
        where: { brandId: dbBrand.id },
      });
      summary.productsDeleted = del.count;
    }
  }

  // 2. brand/category 캐시 (반복 조회 방지)
  const brandCache = new Map<string, string>(); // slug → brandId
  const categoryCache = new Map<string, string>(); // slug → categoryId

  // 3. 각 product seed
  for (const { extractedBrandKey, item } of allItems) {
    try {
      const dbBrandSlug = BRAND_SLUG_MAP[extractedBrandKey] ?? extractedBrandKey;

      // Brand upsert
      let brandId = brandCache.get(dbBrandSlug);
      if (!brandId) {
        const meta = BRAND_NAMES[dbBrandSlug] ?? {
          name: dbBrandSlug,
          nameKo: dbBrandSlug,
        };
        const existed = await prisma.brand.findUnique({
          where: { slug: dbBrandSlug },
        });
        const brand = await prisma.brand.upsert({
          where: { slug: dbBrandSlug },
          update: {},
          create: {
            slug: dbBrandSlug,
            name: meta.name,
            nameKo: meta.nameKo,
            isActive: true,
          },
        });
        brandId = brand.id;
        brandCache.set(dbBrandSlug, brandId);
        if (!existed) summary.brandsCreated += 1;
      }

      // Category upsert
      const catSlug = TYPE_TO_CATEGORY[item.type] ?? "golf-acc";
      let categoryId = categoryCache.get(catSlug);
      if (!categoryId) {
        const existed = await prisma.category.findUnique({
          where: { slug: catSlug },
        });
        const cat = await prisma.category.upsert({
          where: { slug: catSlug },
          update: {},
          create: {
            slug: catSlug,
            name:
              {
                "golf-top": "상의",
                "golf-bottom": "하의",
                "golf-outer": "아우터",
                "golf-shoes": "골프화",
                "golf-cap": "모자·바이저",
                "golf-bag": "가방",
                "golf-acc": "액세서리",
                "golf-club": "클럽",
                "golf-ball": "골프공",
              }[catSlug] ?? catSlug,
            depth: 1,
            sortOrder: 99,
          },
        });
        categoryId = cat.id;
        categoryCache.set(catSlug, categoryId);
        if (!existed) summary.categoriesCreated += 1;
      }

      // Product slug — brand + name 조합. 중복이면 random suffix
      const baseSlug = `${dbBrandSlug}-${slugifyName(item.name)}`;
      let productSlug = baseSlug;
      let attempt = 0;
      while (attempt < 5) {
        const existing = await prisma.product.findUnique({
          where: { slug: productSlug },
        });
        if (!existing) break;
        attempt += 1;
        productSlug = `${baseSlug}-${attempt}`;
      }

      const price = item.price ?? fallbackPriceForType(item.type);
      const salePrice = item.compareAt && item.compareAt > price ? price : undefined;
      const originalPrice = item.compareAt && item.compareAt > price ? item.compareAt : price;

      const created = await prisma.product.create({
        data: {
          brandId,
          categoryId,
          name: item.name,
          slug: productSlug,
          originalPrice,
          salePrice: salePrice ?? null,
          status: "ACTIVE",
          isNew: true,
          sourceUrl: item.sourceUrl,
          sourceSite: extractedBrandKey,
          crawledAt: new Date(),
          images: {
            create: [
              {
                url: item.imageUrl,
                isMain: true,
                sortOrder: 0,
              },
            ],
          },
        },
      });
      summary.productsCreated += 1;
      summary.productImagesCreated += 1;
      void created;
    } catch (e) {
      const msg = e instanceof Error ? e.message.slice(0, 100) : String(e);
      summary.errors.push(`${item.name.slice(0, 30)}: ${msg}`);
      if (summary.errors.length > 30) break;
    }
  }

  return NextResponse.json({
    ok: summary.errors.length < summary.totalToSeed * 0.3,
    summary,
    errorsSample: summary.errors.slice(0, 10),
  });
}
