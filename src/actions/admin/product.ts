"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "./shared";

// ═══════════════════════════════════════
// PRODUCT ACTIONS
// ═══════════════════════════════════════

/** 상품 등록 */
export async function createProduct(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await requireAdmin();

    const name = (formData.get("name") as string)?.trim();
    const brandId = formData.get("brandId") as string;
    const categoryId = formData.get("categoryId") as string;
    const description = (formData.get("description") as string)?.trim() || null;
    const originalPrice = parseInt(formData.get("originalPrice") as string) || 0;
    const salePriceRaw = formData.get("salePrice") as string;
    const salePrice = salePriceRaw ? parseInt(salePriceRaw) || null : null;
    const status = (formData.get("status") as string) || "DRAFT";
    const isNew = formData.get("isNew") === "on";
    const isBest = formData.get("isBest") === "on";

    if (!name || !brandId || !categoryId) {
      return { error: "상품명, 브랜드, 카테고리는 필수입니다." };
    }
    if (originalPrice <= 0) {
      return { error: "원가는 0보다 커야 합니다." };
    }

    // slug 생성
    const baseSlug = slugify(name);
    const slug = await ensureUniqueSlug(baseSlug);

    // 상품 생성
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        brandId,
        categoryId,
        description,
        originalPrice,
        salePrice,
        status: status as any,
        isNew,
        isBest,
      },
    });

    // 이미지 저장
    const imageCount = parseInt(formData.get("imageCount") as string) || 0;
    const mainIdx = parseInt(formData.get("mainImageIdx") as string) || 0;
    const imageData = [];
    for (let i = 0; i < imageCount; i++) {
      const url = (formData.get(`imageUrl_${i}`) as string)?.trim();
      const alt = (formData.get(`imageAlt_${i}`) as string)?.trim() || name;
      if (url) {
        imageData.push({
          productId: product.id,
          url,
          alt,
          sortOrder: i,
          isMain: i === mainIdx,
        });
      }
    }
    if (imageData.length > 0) {
      await prisma.productImage.createMany({ data: imageData });
    }

    // 변형(사이즈/컬러) 저장
    const variantCount = parseInt(formData.get("variantCount") as string) || 0;
    const variantData = [];
    for (let i = 0; i < variantCount; i++) {
      const color = (formData.get(`variantColor_${i}`) as string)?.trim() || null;
      const size = (formData.get(`variantSize_${i}`) as string)?.trim() || null;
      const sku =
        (formData.get(`variantSku_${i}`) as string)?.trim() ||
        `${slug}-${color || "DEFAULT"}-${size || i}`.toUpperCase();
      const stock = parseInt(formData.get(`variantStock_${i}`) as string) || 0;

      if (color || size) {
        variantData.push({
          productId: product.id,
          color,
          size,
          sku,
          stock,
          isActive: true,
        });
      }
    }
    // 변형이 없으면 기본 FREE 사이즈 생성
    if (variantData.length === 0) {
      variantData.push({
        productId: product.id,
        color: null,
        size: "FREE",
        sku: `${slug}-FREE`.toUpperCase(),
        stock: 100,
        isActive: true,
      });
    }
    await prisma.productVariant.createMany({ data: variantData });

    revalidatePath("/admin/products");
    revalidatePath("/products");
    return { success: true };
  } catch (e: any) {
    if (e.code === "P2002") return { error: "중복된 SKU 또는 slug입니다." };
    return { error: e.message };
  }
}

/** 상품 수정 */
export async function updateProduct(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await requireAdmin();

    const id = formData.get("id") as string;
    const name = (formData.get("name") as string)?.trim();
    const brandId = formData.get("brandId") as string;
    const categoryId = formData.get("categoryId") as string;
    const description = (formData.get("description") as string)?.trim() || null;
    const originalPrice = parseInt(formData.get("originalPrice") as string) || 0;
    const salePriceRaw = formData.get("salePrice") as string;
    const salePrice = salePriceRaw ? parseInt(salePriceRaw) || null : null;
    const status = (formData.get("status") as string) || "DRAFT";
    const isNew = formData.get("isNew") === "on";
    const isBest = formData.get("isBest") === "on";

    if (!id || !name || !brandId || !categoryId) {
      return { error: "필수 항목이 누락되었습니다." };
    }

    // 상품 업데이트
    await prisma.product.update({
      where: { id },
      data: {
        name,
        brandId,
        categoryId,
        description,
        originalPrice,
        salePrice,
        status: status as any,
        isNew,
        isBest,
      },
    });

    // 이미지 재생성
    const imageCount = parseInt(formData.get("imageCount") as string) || 0;
    const mainIdx = parseInt(formData.get("mainImageIdx") as string) || 0;
    const imageData = [];
    for (let i = 0; i < imageCount; i++) {
      const url = (formData.get(`imageUrl_${i}`) as string)?.trim();
      const alt = (formData.get(`imageAlt_${i}`) as string)?.trim() || name;
      if (url) {
        imageData.push({
          productId: id,
          url,
          alt,
          sortOrder: i,
          isMain: i === mainIdx,
        });
      }
    }
    await prisma.productImage.deleteMany({ where: { productId: id } });
    if (imageData.length > 0) {
      await prisma.productImage.createMany({ data: imageData });
    }

    // 변형 재생성
    const variantCount = parseInt(formData.get("variantCount") as string) || 0;
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { slug: true },
    });
    const slug = existingProduct?.slug ?? id;

    const variantData = [];
    for (let i = 0; i < variantCount; i++) {
      const color = (formData.get(`variantColor_${i}`) as string)?.trim() || null;
      const size = (formData.get(`variantSize_${i}`) as string)?.trim() || null;
      const sku =
        (formData.get(`variantSku_${i}`) as string)?.trim() ||
        `${slug}-${color || "DEFAULT"}-${size || i}`.toUpperCase();
      const stock = parseInt(formData.get(`variantStock_${i}`) as string) || 0;

      variantData.push({
        productId: id,
        color,
        size,
        sku,
        stock,
        isActive: true,
      });
    }
    await prisma.productVariant.deleteMany({ where: { productId: id } });
    if (variantData.length > 0) {
      await prisma.productVariant.createMany({ data: variantData });
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/products");
    return { success: true };
  } catch (e: any) {
    if (e.code === "P2002") return { error: "중복된 SKU입니다." };
    return { error: e.message };
  }
}

export async function updateProductStatus(productId: string, status: string) {
  await requireAdmin();
  await prisma.product.update({
    where: { id: productId },
    data: { status: status as any },
  });
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: true };
}

export async function deleteProduct(productId: string) {
  await requireAdmin();
  // 관련 데이터 먼저 삭제
  await prisma.productImage.deleteMany({ where: { productId } });
  await prisma.productVariant.deleteMany({ where: { productId } });
  await prisma.productTag.deleteMany({ where: { productId } });
  await prisma.review.deleteMany({ where: { productId } });
  await prisma.productInquiry.deleteMany({ where: { productId } });
  await prisma.wishlistItem.deleteMany({ where: { productId } });
  await prisma.cartItem.deleteMany({ where: { productId } });
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/admin/products");
  return { success: true };
}

export async function updateVariantStock(variantId: string, stock: number) {
  await requireAdmin();
  if (stock < 0) return { error: "재고는 0 이상이어야 합니다." };

  const variant = await prisma.productVariant.update({
    where: { id: variantId },
    data: { stock },
    include: { product: true },
  });

  // Auto-update product status based on stock
  if (stock === 0) {
    const activeVariants = await prisma.productVariant.count({
      where: { productId: variant.productId, stock: { gt: 0 } },
    });
    if (activeVariants === 0) {
      await prisma.product.update({
        where: { id: variant.productId },
        data: { status: "SOLDOUT" },
      });
    }
  } else if (variant.product.status === "SOLDOUT") {
    await prisma.product.update({
      where: { id: variant.productId },
      data: { status: "ACTIVE" },
    });
  }

  revalidatePath("/admin/products");
  return { success: true };
}

// ═══════════════════════════════════════
// UTILS
// ═══════════════════════════════════════

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[가-힣]/g, (ch) =>
      encodeURIComponent(ch).replace(/%/g, "").toLowerCase()
    )
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
