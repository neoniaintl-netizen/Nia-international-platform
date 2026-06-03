"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.");
  return session.user.id;
}

// ─── 장바구니 추가 ───

export async function addToCart(productId: string, variantId: string, quantity = 1) {
  const userId = await getUserId();

  // 옵션이 해당 상품의 것인지 검증 (조작 요청 차단: 상품 A + 옵션 B 혼합 방지)
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant || variant.productId !== productId || !variant.isActive) {
    return { error: "유효하지 않은 상품 옵션입니다." };
  }
  if (variant.stock <= 0) {
    return { error: "해당 옵션은 품절되었습니다." };
  }

  // 이미 같은 상품+옵션이 있으면 수량 증가
  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId_variantId: { userId, productId, variantId } },
  });

  if (existing) {
    if (existing.quantity + quantity > variant.stock) {
      return { error: `재고가 부족합니다. (남은 수량: ${variant.stock}개)` };
    }
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    if (quantity > variant.stock) {
      return { error: `재고가 부족합니다. (남은 수량: ${variant.stock}개)` };
    }
    await prisma.cartItem.create({
      data: { userId, productId, variantId, quantity },
    });
  }

  revalidatePath("/cart");
  revalidatePath("/", "layout"); // 헤더 장바구니 카운트 갱신
  return { success: true };
}

// ─── 수량 변경 ───

export async function updateCartQuantity(cartItemId: string, quantity: number) {
  const userId = await getUserId();

  if (quantity < 1) {
    return removeFromCart(cartItemId);
  }

  await prisma.cartItem.updateMany({
    where: { id: cartItemId, userId },
    data: { quantity },
  });

  revalidatePath("/cart");
  return { success: true };
}

// ─── 장바구니 삭제 ───

export async function removeFromCart(cartItemId: string) {
  const userId = await getUserId();

  await prisma.cartItem.deleteMany({
    where: { id: cartItemId, userId },
  });

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { success: true };
}

// ─── 선택 삭제 ───

export async function removeSelectedFromCart(cartItemIds: string[]) {
  const userId = await getUserId();

  await prisma.cartItem.deleteMany({
    where: { id: { in: cartItemIds }, userId },
  });

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { success: true };
}
