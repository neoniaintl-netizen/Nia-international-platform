"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.");
  return session.user.id;
}

// ─── 프로필 수정 ───

export async function updateProfile(_prevState: any, formData: FormData) {
  const userId = await getUserId();

  const name = formData.get("name") as string;
  const nickname = formData.get("nickname") as string;
  const phone = formData.get("phone") as string;
  const profileImage = formData.get("profileImage") as string;

  if (!name) return { error: "이름을 입력해주세요." };

  // 닉네임 중복 체크
  if (nickname) {
    const existing = await prisma.user.findFirst({
      where: { nickname, id: { not: userId } },
    });
    if (existing) return { error: "이미 사용 중인 닉네임입니다." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      nickname: nickname || null,
      phone: phone || null,
      profileImage: profileImage || null,
    },
  });

  revalidatePath("/my/profile");
  revalidatePath("/my");
  return { success: true };
}

// ─── 배송지 추가 ───

export async function addAddress(_prevState: any, formData: FormData) {
  const userId = await getUserId();

  const label = (formData.get("label") as string) || "집";
  const recipient = formData.get("recipient") as string;
  const phone = formData.get("phone") as string;
  const zipCode = formData.get("zipCode") as string;
  const address1 = formData.get("address1") as string;
  const address2 = formData.get("address2") as string;
  const isDefault = formData.get("isDefault") === "on";

  if (!recipient || !phone || !zipCode || !address1) {
    return { error: "필수 항목을 모두 입력해주세요." };
  }

  // 기본 배송지로 설정 시 기존 기본 배송지 해제
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  await prisma.address.create({
    data: { userId, label, recipient, phone, zipCode, address1, address2: address2 || null, isDefault },
  });

  revalidatePath("/my/addresses");
  return { success: true };
}

// ─── 배송지 삭제 ───

export async function deleteAddress(addressId: string) {
  const userId = await getUserId();

  await prisma.address.deleteMany({
    where: { id: addressId, userId },
  });

  revalidatePath("/my/addresses");
  return { success: true };
}

// ─── 기본 배송지 설정 ───

export async function setDefaultAddress(addressId: string) {
  const userId = await getUserId();

  await prisma.address.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false },
  });

  await prisma.address.updateMany({
    where: { id: addressId, userId },
    data: { isDefault: true },
  });

  revalidatePath("/my/addresses");
  return { success: true };
}

// ─── 비밀번호 변경 ───

export async function changePassword(_prevState: any, formData: FormData) {
  const userId = await getUserId();

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "모든 항목을 입력해주세요." };
  }

  if (newPassword.length < 6) {
    return { error: "새 비밀번호는 6자 이상이어야 합니다." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "새 비밀번호가 일치하지 않습니다." };
  }

  if (currentPassword === newPassword) {
    return { error: "현재 비밀번호와 다른 비밀번호를 입력해주세요." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { error: "소셜 로그인 계정은 비밀번호를 변경할 수 없습니다." };
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return { error: "현재 비밀번호가 올바르지 않습니다." };
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  return { success: true };
}

// ─── 회원 탈퇴 ───

export async function deleteAccount(_prevState: any, formData: FormData) {
  const userId = await getUserId();
  const confirmText = formData.get("confirmText") as string;

  if (confirmText !== "회원탈퇴") {
    return { error: '"회원탈퇴"를 정확히 입력해주세요.' };
  }

  try {
    // Cascade가 설정되지 않은 관계 수동 삭제
    await prisma.$transaction([
      prisma.pointHistory.deleteMany({ where: { userId } }),
      prisma.userCoupon.deleteMany({ where: { userId } }),
      prisma.productInquiry.deleteMany({ where: { userId } }),
      prisma.review.deleteMany({ where: { userId } }),
      prisma.orderItem.deleteMany({
        where: { order: { userId } },
      }),
      prisma.order.deleteMany({ where: { userId } }),
      // Cascade로 자동 삭제: Account, Session, Address, CartItem, WishlistItem
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return { success: true };
  } catch (e) {
    return { error: "회원 탈퇴 처리 중 오류가 발생했습니다. 다시 시도해주세요." };
  }
}
