import { prisma } from "@/lib/db";
import type { CrawledProduct, ImportOptions } from "./types";
import { inferCategoryFromBrandName } from "./brand-category-map";
import { contentHash } from "./engine/content-hash";

/** 재크롤 변경감지용 해시 (가격+할인가+옵션). 품절은 현재 크롤 데이터에 없어 false 고정. */
function itemContentHash(item: CrawledProduct): string {
  return contentHash({
    originalPrice: item.originalPrice,
    salePrice: item.salePrice ?? null,
    soldOut: false,
    options: (item.variants ?? []).map((v) => `${v.size ?? ""}/${v.color ?? ""}`),
  });
}

/**
 * 크롤링된 상품 데이터를 DB에 저장
 * - 브랜드 자동 생성 (없으면)
 * - 카테고리 매칭 (없으면 기본 카테고리)
 * - 상품 upsert (sourceUrl 기준 중복 방지)
 * - 이미지/변형 자동 생성
 * - gender/productCode/externalProductId/season → ProductTag
 * - material/origin/careGuide/fit → description HTML 상단 메타 섹션 prepend
 * - detailImages → ProductImage sortOrder 뒤쪽
 */
export async function importCrawledProducts(
  products: CrawledProduct[],
  crawlJobId: string,
  options?: ImportOptions
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of products) {
    try {
      const status = await importSingleProduct(item, crawlJobId, options);
      // 변경 없음(해시 동일) → skip, 신규/변경(created/updated) → imported
      if (status === "unchanged") skipped++;
      else imported++;
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

async function importSingleProduct(
  item: CrawledProduct,
  crawlJobId: string,
  options?: ImportOptions,
): Promise<"created" | "updated" | "unchanged"> {
  const initialStatus = options?.initialStatus ?? "DRAFT";

  // 0) 변경감지 — 기존 상품(sourceUrl)이 있고 contentHash 동일하면 재작업 없이 skip
  const hash = itemContentHash(item);
  const existing = await prisma.product.findFirst({
    where: { sourceUrl: item.sourceUrl },
    select: { id: true, slug: true, contentHash: true },
  });
  if (existing && existing.contentHash === hash) {
    return "unchanged";
  }

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

  // 4) 상품 생성/업데이트 (existing 은 위 변경감지에서 조회함)
  // description HTML 에 메타 섹션 prepend
  const description = buildDescriptionWithMeta(item);

  const productData = {
    brandId: brand.id,
    categoryId,
    name: item.name,
    description,
    originalPrice: item.originalPrice,
    salePrice: item.salePrice,
    status: initialStatus, // 기본 DRAFT (검수 대기)
    sourceUrl: item.sourceUrl,
    sourceSite: item.sourceSite,
    sourceProductId: item.externalProductId ?? null,
    contentHash: hash,
    crawledAt: new Date(),
    crawlJobId,
  };

  let productId: string;
  let outcome: "created" | "updated";

  if (existing) {
    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: {
        ...productData,
        slug: existing.slug, // slug 유지
      },
    });
    productId = updated.id;
    outcome = "updated";
  } else {
    const created = await prisma.product.create({
      data: {
        ...productData,
        slug,
      },
    });
    productId = created.id;
    outcome = "created";
  }

  // 5) 이미지 – 기존 것 삭제 후 재생성 (imageUrls + detailImages 통합, 순서 보존)
  const galleryImages = item.imageUrls ?? [];
  const detailImages = item.detailImages ?? [];
  const allImages = [...galleryImages, ...detailImages];
  if (allImages.length > 0) {
    await prisma.productImage.deleteMany({ where: { productId } });
    await prisma.productImage.createMany({
      data: allImages.map((url, i) => ({
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
    const existingVariantCount = await prisma.productVariant.count({ where: { productId } });
    if (existingVariantCount === 0) {
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

  // 7) 태그 — gender / season / productCode / externalProductId / tags
  const tagEntries: string[] = [];
  if (item.gender) tagEntries.push(`gender:${item.gender}`);
  if (item.season) tagEntries.push(`season:${item.season}`);
  if (item.productCode) tagEntries.push(`code:${item.productCode}`);
  if (item.externalProductId) tagEntries.push(`extId:${item.externalProductId}`);
  if (item.tags) tagEntries.push(...item.tags);
  if (tagEntries.length > 0) {
    await prisma.productTag.deleteMany({ where: { productId } });
    // 중복 제거
    const uniqueTags = [...new Set(tagEntries)];
    await prisma.productTag.createMany({
      data: uniqueTags.map((tag) => ({ productId, tag })),
      skipDuplicates: true,
    });
  }

  return outcome;
}

/** 메타 정보(소재/제조국/세탁/핏) 섹션을 description HTML 상단에 prepend */
function buildDescriptionWithMeta(item: CrawledProduct): string | undefined {
  const rows: Array<[string, string]> = [];
  if (item.material) rows.push(["소재", item.material]);
  if (item.origin) rows.push(["제조국", item.origin]);
  if (item.careGuide) rows.push(["세탁법", item.careGuide]);
  if (item.fit) rows.push(["핏", item.fit]);

  const baseHtml = item.description ?? "";
  if (rows.length === 0) return baseHtml || undefined;

  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const metaHtml = `<div class="product-meta"><dl>${rows
    .map(([k, v]) => `<dt>${escape(k)}</dt><dd>${escape(v)}</dd>`)
    .join("")}</dl></div>`;

  return `${metaHtml}${baseHtml}`;
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
