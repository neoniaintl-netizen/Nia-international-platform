import { prisma } from "@/lib/db";
import type { CrawledProduct } from "./types";
import { inferCategoryFromBrandName } from "./brand-category-map";

/**
 * 크롤링된 상품 데이터를 DB에 저장
 * - 브랜드 자동 생성 (없으면)
 * - 카테고리 매칭 (없으면 기본 카테고리)
 * - 상품 upsert (sourceUrl 기준 중복 방지)
 * - 이미지/변형 자동 생성
 */
export async function importCrawledProducts(
  products: CrawledProduct[],
  crawlJobId: string
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of products) {
    try {
      await importSingleProduct(item, crawlJobId);
      imported++;
    } catch (err: any) {
      // sourceUrl 중복이면 스킵 처리
      if (err.code === "P2002") {
        skipped++;
      } else {
        errors.push(`${item.name}: ${err.message}`);
      }
    }
  }

  return { imported, skipped, errors };
}

async function importSingleProduct(item: CrawledProduct, crawlJobId: string) {
  // 1) 브랜드 – 있으면 재사용, 없으면 생성
  const brand = await prisma.brand.upsert({
    where: { name: item.brandName },
    update: {},
    create: {
      name: item.brandName,
      slug: slugify(item.brandName),
      isActive: true,
    },
  });

  // 2) 카테고리 – (1) categoryName 매칭 → (2) 브랜드 기반 추론 → (3) "기타" 폴백
  let categoryId: string;
  if (item.categoryName) {
    const category = await prisma.category.findFirst({
      where: {
        name: { contains: item.categoryName, mode: "insensitive" },
      },
    });
    if (category?.id) {
      categoryId = category.id;
    } else {
      categoryId = await resolveBrandCategoryId(item.brandName);
    }
  } else {
    categoryId = await resolveBrandCategoryId(item.brandName);
  }

  // 3) 상품 slug 생성 (중복 방지)
  const baseSlug = slugify(item.name);
  const slug = await ensureUniqueSlug(baseSlug);

  // 4) 상품 생성 (sourceUrl 존재 시 업데이트)
  const existingProduct = await prisma.product.findFirst({
    where: { sourceUrl: item.sourceUrl },
  });

  const productData = {
    brandId: brand.id,
    categoryId,
    name: item.name,
    description: item.description,
    originalPrice: item.originalPrice,
    salePrice: item.salePrice,
    status: "DRAFT" as const, // 크롤링 후 검수 대기
    sourceUrl: item.sourceUrl,
    sourceSite: item.sourceSite,
    crawledAt: new Date(),
    crawlJobId,
  };

  let productId: string;

  if (existingProduct) {
    const updated = await prisma.product.update({
      where: { id: existingProduct.id },
      data: {
        ...productData,
        slug: existingProduct.slug, // slug 유지
      },
    });
    productId = updated.id;
  } else {
    const created = await prisma.product.create({
      data: {
        ...productData,
        slug,
      },
    });
    productId = created.id;
  }

  // 5) 이미지 – 기존 것 삭제 후 재생성
  if (item.imageUrls.length > 0) {
    await prisma.productImage.deleteMany({ where: { productId } });
    await prisma.productImage.createMany({
      data: item.imageUrls.map((url, i) => ({
        productId,
        url,
        alt: item.name,
        sortOrder: i,
        isMain: i === 0,
      })),
    });
  }

  // 6) 변형(사이즈/컬러)
  if (item.variants && item.variants.length > 0) {
    await prisma.productVariant.deleteMany({ where: { productId } });
    await prisma.productVariant.createMany({
      data: item.variants.map((v, i) => ({
        productId,
        sku: `${slug}-${v.size || v.color || i}`.toUpperCase(),
        size: v.size,
        color: v.color,
        stock: v.stock ?? 100,
        isActive: true,
      })),
    });
  } else {
    // variant 정보가 없으면 기본 ONE SIZE 단일 variant 생성 (장바구니 담기 가능하도록)
    const existing = await prisma.productVariant.count({ where: { productId } });
    if (existing === 0) {
      await prisma.productVariant.create({
        data: {
          productId,
          sku: `${slug}-ONESIZE`.toUpperCase(),
          size: "ONE SIZE",
          stock: 100,
          isActive: true,
        },
      });
    }
  }
}

// ── Helpers ──

let defaultCategoryId: string | null = null;

async function getDefaultCategoryId(): Promise<string> {
  if (defaultCategoryId) return defaultCategoryId;

  // "기타" 카테고리 찾거나 생성
  let cat = await prisma.category.findFirst({
    where: { slug: "etc" },
  });

  if (!cat) {
    cat = await prisma.category.create({
      data: {
        name: "기타",
        slug: "etc",
        depth: 0,
        sortOrder: 999,
      },
    });
  }

  defaultCategoryId = cat.id;
  return cat.id;
}

/** 브랜드 이름 기반으로 기본 카테고리를 찾아 id 반환. 실패 시 "기타". */
async function resolveBrandCategoryId(brandName: string): Promise<string> {
  const inferredSlug = inferCategoryFromBrandName(brandName);
  if (inferredSlug) {
    const cat = await prisma.category.findUnique({
      where: { slug: inferredSlug },
      select: { id: true },
    });
    if (cat) return cat.id;
  }
  return getDefaultCategoryId();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[가-힣]/g, (ch) => {
      // 한글을 로마자로 대략적 변환 (slug용)
      return encodeURIComponent(ch).replace(/%/g, "").toLowerCase();
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `product-${Date.now()}`;
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = base;
  let count = 0;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing) return slug;
    count++;
    slug = `${base}-${count}`;
  }
}
