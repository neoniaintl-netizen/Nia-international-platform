"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

// ─── 로그인 ───

export async function loginAction(_prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "이메일 또는 비밀번호가 일치하지 않습니다." };
        default:
          return { error: "로그인 중 오류가 발생했습니다." };
      }
    }
    throw error;
  }

  redirect("/");
}

// ─── 회원가입 ───

export async function registerAction(_prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const name = formData.get("name") as string;
  const agreeTerms = formData.get("agreeTerms") === "on";
  const agreePrivacy = formData.get("agreePrivacy") === "on";

  // Validation
  if (!email || !password || !name) {
    return { error: "모든 필수 항목을 입력해주세요." };
  }

  if (password.length < 8 || password.length > 30) {
    return { error: "비밀번호는 8~30자로 입력해주세요." };
  }

  if (password !== confirmPassword) {
    return { error: "비밀번호가 일치하지 않습니다." };
  }

  if (!agreeTerms || !agreePrivacy) {
    return { error: "필수 약관에 동의해주세요." };
  }

  // Check duplicate
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return { error: "이미 가입된 이메일입니다." };
  }

  // Create user
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: "CUSTOMER",
    },
  });

  // Auto login after register
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch {
    // If auto-login fails, just redirect to login
    redirect("/login");
  }

  redirect("/");
}

// ─── 소셜 로그인 ───

export async function socialLoginAction(provider: "kakao" | "naver") {
  await signIn(provider, { redirectTo: "/" });
}

// ─── 로그아웃 ───

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
