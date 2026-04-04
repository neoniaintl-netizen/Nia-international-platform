"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다.");
  }
  return session.user.id;
}

// ═══════════════════════════════════════
// PRODUCT ACTIONS
// ═══════════════════════════════════════

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

// ═══════════════════════════════════════
// BRAND ACTIONS
// ═══════════════════════════════════════

export async function createBrand(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await requireAdmin();
    const name = (formData.get("name") as string)?.trim();
    const nameKo = (formData.get("nameKo") as string)?.trim() || null;
    const slug = (formData.get("slug") as string)?.trim();
    const logoUrl = (formData.get("logoUrl") as string)?.trim() || null;
    const description = (formData.get("description") as string)?.trim() || null;

    if (!name || !slug) return { error: "브랜드명과 slug는 필수입니다." };

    await prisma.brand.create({
      data: { name, nameKo, slug, logoUrl, description },
    });
    revalidatePath("/admin/brands");
    return { success: true };
  } catch (e: any) {
    if (e.code === "P2002") return { error: "이미 존재하는 브랜드명 또는 slug입니다." };
    return { error: e.message };
  }
}

export async function updateBrand(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await requireAdmin();
    const id = formData.get("id") as string;
    const name = (formData.get("name") as string)?.trim();
    const nameKo = (formData.get("nameKo") as string)?.trim() || null;
    const logoUrl = (formData.get("logoUrl") as string)?.trim() || null;
    const description = (formData.get("description") as string)?.trim() || null;
    const isActive = formData.get("isActive") === "on";

    if (!name) return { error: "브랜드명은 필수입니다." };

    await prisma.brand.update({
      where: { id },
      data: { name, nameKo, logoUrl, description, isActive },
    });
    revalidatePath("/admin/brands");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteBrand(brandId: string) {
  await requireAdmin();
  const productCount = await prisma.product.count({ where: { brandId } });
  if (productCount > 0) {
    return { error: `${productCount}개의 상품이 연결되어 있어 삭제할 수 없습니다.` };
  }
  await prisma.brand.delete({ where: { id: brandId } });
  revalidatePath("/admin/brands");
  return { success: true };
}

// ═══════════════════════════════════════
// ORDER ACTIONS
// ═══════════════════════════════════════

export async function updateOrderStatus(orderId: string, status: string) {
  await requireAdmin();
  await prisma.order.update({
    where: { id: orderId },
    data: { status: status as any },
  });
  revalidatePath("/admin/orders");
  return { success: true };
}

// ═══════════════════════════════════════
// BANNER ACTIONS
// ═══════════════════════════════════════

export async function createBanner(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await requireAdmin();
    const title = (formData.get("title") as string)?.trim();
    const subtitle = (formData.get("subtitle") as string)?.trim() || null;
    const imageUrl = (formData.get("imageUrl") as string)?.trim();
    const linkUrl = (formData.get("linkUrl") as string)?.trim() || null;
    const position = (formData.get("position") as string) || "HOME_MAIN";
    const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;
    const isActive = formData.get("isActive") === "on";

    if (!title || !imageUrl) return { error: "제목과 이미지 URL은 필수입니다." };

    await prisma.banner.create({
      data: { title, subtitle, imageUrl, linkUrl, position, sortOrder, isActive },
    });
    revalidatePath("/admin/banners");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteBanner(bannerId: string) {
  await requireAdmin();
  await prisma.banner.delete({ where: { id: bannerId } });
  revalidatePath("/admin/banners");
  return { success: true };
}

export async function toggleBannerActive(bannerId: string, isActive: boolean) {
  await requireAdmin();
  await prisma.banner.update({ where: { id: bannerId }, data: { isActive } });
  revalidatePath("/admin/banners");
  return { success: true };
}

// ═══════════════════════════════════════
// COUPON ACTIONS
// ═══════════════════════════════════════

export async function createCoupon(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
) {
  try {
    await requireAdmin();
    const code = (formData.get("code") as string)?.trim();
    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const discountType = formData.get("discountType") as string;
    const discountValue = parseInt(formData.get("discountValue") as string) || 0;
    const minOrderAmount = parseInt(formData.get("minOrderAmount") as string) || null;
    const maxDiscount = parseInt(formData.get("maxDiscount") as string) || null;
    const totalQuantity = parseInt(formData.get("totalQuantity") as string) || null;
    const startsAt = new Date(formData.get("startsAt") as string);
    const expiresAt = new Date(formData.get("expiresAt") as string);

    if (!code || !name || !discountValue) return { error: "필수 항목을 입력해주세요." };

    await prisma.coupon.create({
      data: {
        code,
        name,
        description,
        discountType: discountType as any,
        discountValue,
        minOrderAmount,
        maxDiscount,
        totalQuantity,
        startsAt,
        expiresAt,
      },
    });
    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (e: any) {
    if (e.code === "P2002") return { error: "이미 존재하는 쿠폰 코드입니다." };
    return { error: e.message };
  }
}

export async function deleteCoupon(couponId: string) {
  await requireAdmin();
  await prisma.userCoupon.deleteMany({ where: { couponId } });
  await prisma.coupon.delete({ where: { id: couponId } });
  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function toggleCouponActive(couponId: string, isActive: boolean) {
  await requireAdmin();
  await prisma.coupon.update({ where: { id: couponId }, data: { isActive } });
  revalidatePath("/admin/coupons");
  return { success: true };
}

// ═══════════════════════════════════════
// USER ACTIONS
// ═══════════════════════════════════════

export async function updateUserRole(userId: string, role: string) {
  await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { role: role as any },
  });
  revalidatePath("/admin/users");
  return { success: true };
}
