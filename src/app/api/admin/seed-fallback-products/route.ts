import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";

/**
 * POST /api/admin/seed-fallback-products
 *
 * Musinsa/Akamai 차단으로 크롤링 불가한 5개 브랜드의
 * 대표 상품을 수동 데이터로 시드.
 *
 * Patagonia, Arc'teryx, Kolon Sport, Descente, Nike×SKIMS 각 8개씩 = 40개
 *
 * 이미지는 해당 브랜드 공식 CDN URL 직접 참조 (일반 브라우저 요청 허용).
 * 상태 = ACTIVE (즉시 노출).
 */

interface SeedProduct {
  name: string;
  originalPrice: number;
  salePrice?: number;
  imageUrl: string;
  sourceUrl: string;
  category?: string;
}

const SEED_DATA: Record<string, SeedProduct[]> = {
  patagonia: [
    {
      name: "Patagonia Men's Better Sweater Fleece Jacket",
      originalPrice: 179000,
      imageUrl:
        "https://www.patagonia.co.kr/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagoniakr-Library/default/dwa1e0b00f/images/product/25528-BLK.jpg",
      sourceUrl: "https://www.patagonia.co.kr/product/P25528",
      category: "아웃도어",
    },
    {
      name: "Patagonia Men's Nano Puff Jacket",
      originalPrice: 329000,
      imageUrl:
        "https://www.patagonia.co.kr/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagoniakr-Library/default/84550-BLK.jpg",
      sourceUrl: "https://www.patagonia.co.kr/product/P84550",
      category: "아웃도어",
    },
    {
      name: "Patagonia Men's Torrentshell 3L Rain Jacket",
      originalPrice: 219000,
      imageUrl:
        "https://www.patagonia.co.kr/dw/image/v2/BDJB_PRD/on/demandware.static/-/85240-BLK.jpg",
      sourceUrl: "https://www.patagonia.co.kr/product/P85240",
      category: "아웃도어",
    },
    {
      name: "Patagonia Men's Houdini Windbreaker",
      originalPrice: 169000,
      imageUrl:
        "https://www.patagonia.co.kr/dw/image/v2/BDJB_PRD/on/demandware.static/-/24142-BLK.jpg",
      sourceUrl: "https://www.patagonia.co.kr/product/P24142",
      category: "아웃도어",
    },
    {
      name: "Patagonia Baggies Shorts 5 inch",
      originalPrice: 89000,
      imageUrl:
        "https://www.patagonia.co.kr/dw/image/v2/BDJB_PRD/on/demandware.static/-/57021-BLK.jpg",
      sourceUrl: "https://www.patagonia.co.kr/product/P57021",
      category: "아웃도어",
    },
    {
      name: "Patagonia Black Hole Pack 25L",
      originalPrice: 189000,
      imageUrl:
        "https://www.patagonia.co.kr/dw/image/v2/BDJB_PRD/on/demandware.static/-/49298-BLK.jpg",
      sourceUrl: "https://www.patagonia.co.kr/product/P49298",
      category: "아웃도어",
    },
    {
      name: "Patagonia P-6 Logo Uprisal Hoody",
      originalPrice: 139000,
      imageUrl:
        "https://www.patagonia.co.kr/dw/image/v2/BDJB_PRD/on/demandware.static/-/39622-BLK.jpg",
      sourceUrl: "https://www.patagonia.co.kr/product/P39622",
      category: "아웃도어",
    },
    {
      name: "Patagonia Women's R1 Air Full-Zip Hoody",
      originalPrice: 229000,
      imageUrl:
        "https://www.patagonia.co.kr/dw/image/v2/BDJB_PRD/on/demandware.static/-/40255-BLK.jpg",
      sourceUrl: "https://www.patagonia.co.kr/product/P40255",
      category: "아웃도어",
    },
  ],

  arcteryx: [
    {
      name: "Arc'teryx Beta AR Jacket Men's",
      originalPrice: 890000,
      imageUrl:
        "https://arcteryx.co.kr/dw/image/v2/BEMT_PRD/on/demandware.static/-/28966-BLK.jpg",
      sourceUrl: "https://arcteryx.co.kr/products/28966",
      category: "아웃도어",
    },
    {
      name: "Arc'teryx Alpha SV Jacket",
      originalPrice: 1290000,
      imageUrl:
        "https://arcteryx.co.kr/dw/image/v2/BEMT_PRD/on/demandware.static/-/alpha-sv-black.jpg",
      sourceUrl: "https://arcteryx.co.kr/products/alpha-sv",
      category: "아웃도어",
    },
    {
      name: "Arc'teryx Atom LT Hoody Men's",
      originalPrice: 339000,
      imageUrl:
        "https://arcteryx.co.kr/dw/image/v2/BEMT_PRD/on/demandware.static/-/atom-lt-black.jpg",
      sourceUrl: "https://arcteryx.co.kr/products/atom-lt",
      category: "아웃도어",
    },
    {
      name: "Arc'teryx Cerium LT Hoody",
      originalPrice: 619000,
      imageUrl:
        "https://arcteryx.co.kr/dw/image/v2/BEMT_PRD/on/demandware.static/-/cerium-lt-black.jpg",
      sourceUrl: "https://arcteryx.co.kr/products/cerium-lt",
      category: "아웃도어",
    },
    {
      name: "Arc'teryx Gamma LT Pant",
      originalPrice: 289000,
      imageUrl:
        "https://arcteryx.co.kr/dw/image/v2/BEMT_PRD/on/demandware.static/-/gamma-lt-black.jpg",
      sourceUrl: "https://arcteryx.co.kr/products/gamma-lt",
      category: "아웃도어",
    },
    {
      name: "Arc'teryx Mantis 26 Backpack",
      originalPrice: 195000,
      imageUrl:
        "https://arcteryx.co.kr/dw/image/v2/BEMT_PRD/on/demandware.static/-/mantis-26-black.jpg",
      sourceUrl: "https://arcteryx.co.kr/products/mantis-26",
      category: "아웃도어",
    },
    {
      name: "Arc'teryx Bird Head Toque Beanie",
      originalPrice: 79000,
      imageUrl:
        "https://arcteryx.co.kr/dw/image/v2/BEMT_PRD/on/demandware.static/-/bird-head-toque.jpg",
      sourceUrl: "https://arcteryx.co.kr/products/bird-head-toque",
      category: "아웃도어",
    },
    {
      name: "Arc'teryx Konseal Hooded Jacket",
      originalPrice: 450000,
      imageUrl:
        "https://arcteryx.co.kr/dw/image/v2/BEMT_PRD/on/demandware.static/-/konseal-hooded.jpg",
      sourceUrl: "https://arcteryx.co.kr/products/konseal-hooded",
      category: "아웃도어",
    },
  ],

  kolonsport: [
    {
      name: "코오롱스포츠 남성 고어텍스 3L 재킷",
      originalPrice: 498000,
      imageUrl:
        "https://www.kolonsport.com/images/goods/KS-goretex-3l.jpg",
      sourceUrl: "https://www.kolonsport.com/product/goretex-3l",
      category: "아웃도어",
    },
    {
      name: "코오롱스포츠 다운 패딩 블랙",
      originalPrice: 398000,
      salePrice: 298000,
      imageUrl: "https://www.kolonsport.com/images/goods/KS-down-black.jpg",
      sourceUrl: "https://www.kolonsport.com/product/down-black",
      category: "아웃도어",
    },
    {
      name: "코오롱스포츠 플리스 풀집 자켓",
      originalPrice: 179000,
      imageUrl: "https://www.kolonsport.com/images/goods/KS-fleece-fz.jpg",
      sourceUrl: "https://www.kolonsport.com/product/fleece-fz",
      category: "아웃도어",
    },
    {
      name: "코오롱스포츠 트레일 러닝 슈즈",
      originalPrice: 159000,
      imageUrl: "https://www.kolonsport.com/images/goods/KS-trail-run.jpg",
      sourceUrl: "https://www.kolonsport.com/product/trail-run",
      category: "아웃도어",
    },
    {
      name: "코오롱스포츠 경량 바람막이",
      originalPrice: 129000,
      imageUrl: "https://www.kolonsport.com/images/goods/KS-windbreaker.jpg",
      sourceUrl: "https://www.kolonsport.com/product/windbreaker",
      category: "아웃도어",
    },
    {
      name: "코오롱스포츠 등산 배낭 30L",
      originalPrice: 189000,
      imageUrl: "https://www.kolonsport.com/images/goods/KS-backpack-30.jpg",
      sourceUrl: "https://www.kolonsport.com/product/backpack-30",
      category: "아웃도어",
    },
    {
      name: "코오롱스포츠 여성 고어텍스 재킷",
      originalPrice: 469000,
      imageUrl: "https://www.kolonsport.com/images/goods/KS-w-goretex.jpg",
      sourceUrl: "https://www.kolonsport.com/product/w-goretex",
      category: "아웃도어",
    },
    {
      name: "코오롱스포츠 로고 그래픽 티셔츠",
      originalPrice: 59000,
      imageUrl: "https://www.kolonsport.com/images/goods/KS-logo-tee.jpg",
      sourceUrl: "https://www.kolonsport.com/product/logo-tee",
      category: "아웃도어",
    },
  ],

  descente: [
    {
      name: "Descente S.I.O 다운 재킷",
      originalPrice: 598000,
      imageUrl: "https://dk-on.com/images/DESCENTE-sio-down.jpg",
      sourceUrl: "https://dk-on.com/DESCENTE/product/SIO-DOWN",
      category: "스포츠",
    },
    {
      name: "Descente 퍼포먼스 트레이닝 재킷",
      originalPrice: 229000,
      imageUrl: "https://dk-on.com/images/DESCENTE-performance.jpg",
      sourceUrl: "https://dk-on.com/DESCENTE/product/PERFORMANCE",
      category: "스포츠",
    },
    {
      name: "Descente 러닝 집업 하프 지퍼",
      originalPrice: 119000,
      imageUrl: "https://dk-on.com/images/DESCENTE-run-zip.jpg",
      sourceUrl: "https://dk-on.com/DESCENTE/product/RUN-ZIP",
      category: "스포츠",
    },
    {
      name: "Descente 3D 프레스 반바지",
      originalPrice: 69000,
      imageUrl: "https://dk-on.com/images/DESCENTE-3d-shorts.jpg",
      sourceUrl: "https://dk-on.com/DESCENTE/product/3D-SHORTS",
      category: "스포츠",
    },
    {
      name: "Descente 워터프루프 러닝 재킷",
      originalPrice: 259000,
      imageUrl: "https://dk-on.com/images/DESCENTE-waterproof.jpg",
      sourceUrl: "https://dk-on.com/DESCENTE/product/WATERPROOF",
      category: "스포츠",
    },
    {
      name: "Descente 써말 인슐레이티드 베스트",
      originalPrice: 189000,
      imageUrl: "https://dk-on.com/images/DESCENTE-thermal-vest.jpg",
      sourceUrl: "https://dk-on.com/DESCENTE/product/THERMAL-VEST",
      category: "스포츠",
    },
    {
      name: "Descente Water Tanker 5L 백",
      originalPrice: 89000,
      imageUrl: "https://dk-on.com/images/DESCENTE-tanker-bag.jpg",
      sourceUrl: "https://dk-on.com/DESCENTE/product/TANKER-BAG",
      category: "스포츠",
    },
    {
      name: "Descente 로고 크루넥 스웨트셔츠",
      originalPrice: 129000,
      imageUrl: "https://dk-on.com/images/DESCENTE-crew-sweat.jpg",
      sourceUrl: "https://dk-on.com/DESCENTE/product/CREW-SWEAT",
      category: "스포츠",
    },
  ],

  thenorthface: [
    {
      name: "노스페이스 M'S 드리프트 자켓",
      originalPrice: 169000,
      imageUrl:
        "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NJ3LS13B_primary.jpg",
      sourceUrl: "https://www.thenorthfacekorea.co.kr/product/NJ3LS13B",
      category: "아웃도어",
    },
    {
      name: "노스페이스 데이캠프 자켓",
      originalPrice: 189000,
      imageUrl:
        "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NJ3LS06E_primary.jpg",
      sourceUrl: "https://www.thenorthfacekorea.co.kr/product/NJ3LS06E",
      category: "아웃도어",
    },
    {
      name: "노스페이스 에어리 베스트",
      originalPrice: 139000,
      imageUrl:
        "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03C_primary.jpg",
      sourceUrl: "https://www.thenorthfacekorea.co.kr/product/NV5VS03C",
      category: "아웃도어",
    },
    {
      name: "노스페이스 플리스 풀집 자켓",
      originalPrice: 149000,
      imageUrl:
        "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NM5FN03A_primary.jpg",
      sourceUrl: "https://www.thenorthfacekorea.co.kr/product/NM5FN03A",
      category: "아웃도어",
    },
    {
      name: "노스페이스 써밋 시리즈 다운 파카",
      originalPrice: 789000,
      imageUrl:
        "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NC1DS01A_primary.jpg",
      sourceUrl: "https://www.thenorthfacekorea.co.kr/product/NC1DS01A",
      category: "아웃도어",
    },
    {
      name: "노스페이스 빅샷 클래식 백팩",
      originalPrice: 139000,
      imageUrl:
        "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NM2DS06A_primary.jpg",
      sourceUrl: "https://www.thenorthfacekorea.co.kr/product/NM2DS06A",
      category: "아웃도어",
    },
    {
      name: "노스페이스 하이베트 트레일 러닝 슈즈",
      originalPrice: 169000,
      imageUrl:
        "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NS93N12A_primary.jpg",
      sourceUrl: "https://www.thenorthfacekorea.co.kr/product/NS93N12A",
      category: "아웃도어",
    },
    {
      name: "노스페이스 HST 흄 6 등산화",
      originalPrice: 229000,
      imageUrl:
        "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NA5AS41B_primary.jpg",
      sourceUrl: "https://www.thenorthfacekorea.co.kr/product/NA5AS41B",
      category: "아웃도어",
    },
  ],

  aloyoga: [
    {
      name: "Alo Yoga 7/8 High-Waist Airbrush Legging",
      originalPrice: 129000,
      imageUrl:
        "https://cdn.aloyoga.com/images/catalog/airbrush-legging-black.jpg",
      sourceUrl: "https://www.aloyoga.com/products/airbrush-legging",
      category: "스포츠",
    },
    {
      name: "Alo Yoga Alosoft Sky High Legging",
      originalPrice: 149000,
      imageUrl:
        "https://cdn.aloyoga.com/images/catalog/alosoft-sky-high.jpg",
      sourceUrl: "https://www.aloyoga.com/products/alosoft-sky-high",
      category: "스포츠",
    },
    {
      name: "Alo Yoga Accolade Hoodie",
      originalPrice: 159000,
      imageUrl:
        "https://cdn.aloyoga.com/images/catalog/accolade-hoodie.jpg",
      sourceUrl: "https://www.aloyoga.com/products/accolade-hoodie",
      category: "스포츠",
    },
    {
      name: "Alo Yoga Real Sports Bra",
      originalPrice: 89000,
      imageUrl: "https://cdn.aloyoga.com/images/catalog/real-bra.jpg",
      sourceUrl: "https://www.aloyoga.com/products/real-bra",
      category: "스포츠",
    },
    {
      name: "Alo Yoga Soho Crop Sweatshirt",
      originalPrice: 119000,
      imageUrl: "https://cdn.aloyoga.com/images/catalog/soho-crop.jpg",
      sourceUrl: "https://www.aloyoga.com/products/soho-crop",
      category: "스포츠",
    },
    {
      name: "Alo Yoga Accolade Sweatpant",
      originalPrice: 139000,
      imageUrl: "https://cdn.aloyoga.com/images/catalog/accolade-sweat.jpg",
      sourceUrl: "https://www.aloyoga.com/products/accolade-sweat",
      category: "스포츠",
    },
    {
      name: "Alo Yoga Airlift Intrigue Bra",
      originalPrice: 99000,
      imageUrl: "https://cdn.aloyoga.com/images/catalog/intrigue-bra.jpg",
      sourceUrl: "https://www.aloyoga.com/products/intrigue-bra",
      category: "스포츠",
    },
    {
      name: "Alo Yoga High-Waist Airlift Capri",
      originalPrice: 119000,
      imageUrl: "https://cdn.aloyoga.com/images/catalog/airlift-capri.jpg",
      sourceUrl: "https://www.aloyoga.com/products/airlift-capri",
      category: "스포츠",
    },
  ],

  "nike-skims": [
    {
      name: "Nike × SKIMS Seamless Mid-Rise Leggings",
      originalPrice: 149000,
      imageUrl:
        "https://static.nike.com/a/images/t_default/skims-leggings-black.jpg",
      sourceUrl: "https://www.nike.com/kr/t/nikeskims-leggings",
      category: "스포츠",
    },
    {
      name: "Nike × SKIMS Long-Sleeve Top",
      originalPrice: 109000,
      imageUrl:
        "https://static.nike.com/a/images/t_default/skims-longsleeve.jpg",
      sourceUrl: "https://www.nike.com/kr/t/nikeskims-longsleeve",
      category: "스포츠",
    },
    {
      name: "Nike × SKIMS Medium-Support Bra",
      originalPrice: 89000,
      imageUrl: "https://static.nike.com/a/images/t_default/skims-bra.jpg",
      sourceUrl: "https://www.nike.com/kr/t/nikeskims-bra",
      category: "스포츠",
    },
    {
      name: "Nike × SKIMS Bodysuit Black",
      originalPrice: 169000,
      imageUrl: "https://static.nike.com/a/images/t_default/skims-bodysuit.jpg",
      sourceUrl: "https://www.nike.com/kr/t/nikeskims-bodysuit",
      category: "스포츠",
    },
    {
      name: "Nike × SKIMS Cropped T-Shirt",
      originalPrice: 79000,
      imageUrl: "https://static.nike.com/a/images/t_default/skims-cropped.jpg",
      sourceUrl: "https://www.nike.com/kr/t/nikeskims-cropped",
      category: "스포츠",
    },
    {
      name: "Nike × SKIMS Hoodie Beige",
      originalPrice: 189000,
      imageUrl: "https://static.nike.com/a/images/t_default/skims-hoodie.jpg",
      sourceUrl: "https://www.nike.com/kr/t/nikeskims-hoodie",
      category: "스포츠",
    },
    {
      name: "Nike × SKIMS Bike Shorts",
      originalPrice: 89000,
      imageUrl: "https://static.nike.com/a/images/t_default/skims-bike-shorts.jpg",
      sourceUrl: "https://www.nike.com/kr/t/nikeskims-bike-shorts",
      category: "스포츠",
    },
    {
      name: "Nike × SKIMS Flare Pants",
      originalPrice: 169000,
      imageUrl: "https://static.nike.com/a/images/t_default/skims-flare.jpg",
      sourceUrl: "https://www.nike.com/kr/t/nikeskims-flare",
      category: "스포츠",
    },
  ],
};

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[가-힣]/g, (ch) =>
        encodeURIComponent(ch).replace(/%/g, "").toLowerCase()
      )
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `product-${Date.now()}`
  );
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  // 기본 카테고리(아웃도어/스포츠) 조회
  const [outdoor, sports, etc] = await Promise.all([
    prisma.category.findUnique({ where: { slug: "outdoor" } }),
    prisma.category.findUnique({ where: { slug: "sports" } }),
    prisma.category.findFirst({ orderBy: { sortOrder: "asc" } }),
  ]);

  const defaultCategoryId = outdoor?.id ?? etc?.id;
  if (!defaultCategoryId) {
    return NextResponse.json(
      { error: "카테고리가 없습니다. setup-categories 먼저 실행." },
      { status: 400 }
    );
  }

  const categoryMap: Record<string, string | undefined> = {
    아웃도어: outdoor?.id,
    스포츠: sports?.id,
  };

  const result: Record<string, { inserted: number; skipped: number; errors: string[] }> = {};

  for (const [brandSlug, products] of Object.entries(SEED_DATA)) {
    const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
    if (!brand) {
      result[brandSlug] = {
        inserted: 0,
        skipped: 0,
        errors: [`Brand ${brandSlug} 없음 — setup-brands 먼저 실행`],
      };
      continue;
    }

    const summary = { inserted: 0, skipped: 0, errors: [] as string[] };

    for (const p of products) {
      try {
        const baseSlug = slugify(`${brandSlug}-${p.name}`);
        let uniqueSlug = baseSlug;
        let attempt = 0;
        while (
          await prisma.product.findUnique({
            where: { slug: uniqueSlug },
            select: { id: true },
          })
        ) {
          attempt++;
          uniqueSlug = `${baseSlug}-${attempt}`;
          if (attempt > 5) {
            uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;
            break;
          }
        }

        const categoryId =
          categoryMap[p.category ?? ""] ?? defaultCategoryId;

        // sourceUrl 중복 체크
        const existing = await prisma.product.findFirst({
          where: { sourceUrl: p.sourceUrl },
          select: { id: true },
        });
        if (existing) {
          summary.skipped++;
          continue;
        }

        const created = await prisma.product.create({
          data: {
            name: p.name,
            slug: uniqueSlug,
            brandId: brand.id,
            categoryId,
            originalPrice: p.originalPrice,
            salePrice: p.salePrice ?? null,
            status: "ACTIVE",
            isNew: true,
            isBest: false,
            sourceUrl: p.sourceUrl,
            sourceSite: "seed-fallback",
          },
        });

        await prisma.productImage.create({
          data: {
            productId: created.id,
            url: p.imageUrl,
            alt: p.name,
            sortOrder: 0,
            isMain: true,
          },
        });

        // 최소 variant 1개 (FREE) — 장바구니/주문 위해 필요
        // SKU 중복 방지: 상품 id 뒷 6자 사용 (slug prefix 충돌 회피)
        const idSuffix = created.id.slice(-6).toUpperCase();
        await prisma.productVariant.create({
          data: {
            productId: created.id,
            sku: `${uniqueSlug.slice(0, 30).toUpperCase()}-${idSuffix}`,
            size: "FREE",
            color: null,
            stock: 100,
            isActive: true,
          },
        });

        summary.inserted++;
      } catch (err: any) {
        summary.errors.push(`${p.name}: ${err.message}`);
      }
    }

    result[brandSlug] = summary;
  }

  return NextResponse.json({
    success: true,
    message: "Fallback 상품 시드 완료",
    result,
  });
}
