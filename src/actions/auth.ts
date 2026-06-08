"use server";

import { randomBytes } from "node:crypto";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { safeCallbackUrl } from "@/lib/utils";

// ─── 로그인 ───

export async function loginAction(_prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const callbackUrl = safeCallbackUrl(formData.get("callbackUrl") as string);

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
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

  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { error: "비밀번호는 영문과 숫자를 모두 포함해야 합니다." };
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
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login");
    }
    throw error;
  }
}

// ─── 로그아웃 ───

export async function logoutAction() {
  // 서버에서 세션 쿠키를 확실히 만료. (리다이렉트는 끄고, 클라이언트가 하드 리로드)
  await signOut({ redirect: false });
}

// ─── 아이디(이메일) 찾기 ───

/** 이메일을 *****로 마스킹 */
function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}${"*".repeat(Math.max(3, local.length - 2))}@${domain}`;
}

export async function findIdAction(_prevState: any, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();

  if (!name || !phone) {
    return { error: "이름과 휴대폰 번호를 입력해주세요." };
  }

  const user = await prisma.user.findFirst({
    where: { name, phone },
    select: { email: true, createdAt: true },
  });

  if (!user) {
    return { error: "일치하는 회원 정보가 없습니다." };
  }

  return {
    success: true,
    email: maskEmail(user.email),
    createdAt: user.createdAt.toISOString().split("T")[0],
  };
}

// ─── 비밀번호 재설정 요청 ───

export async function requestPasswordResetAction(
  _prevState: any,
  formData: FormData
) {
  const email = (formData.get("email") as string)?.trim();

  if (!email) {
    return { error: "이메일을 입력해주세요." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // 사용자 존재 여부와 관계없이 동일한 응답(보안상 열거 방지)
  if (!user) {
    return {
      success: true,
      message:
        "입력하신 이메일로 비밀번호 재설정 안내가 발송됩니다. 메일이 오지 않으면 고객센터(1544-7199)로 문의해주세요.",
    };
  }

  // 암호학적으로 안전한 256-bit 토큰 (예측 불가)
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1시간

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  // production 로그에 토큰 평문 노출 금지 — 이메일 전송은 별도 구현 예정
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[reset-token:dev] ${email} → /reset-password?token=${token}`
    );
  }

  return {
    success: true,
    message:
      "입력하신 이메일로 비밀번호 재설정 안내를 발송했습니다. 1시간 내에 메일의 링크를 클릭해주세요.",
  };
}

// ─── 비밀번호 재설정 ───

export async function resetPasswordAction(
  _prevState: any,
  formData: FormData
) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token) return { error: "유효하지 않은 접근입니다." };
  if (!password || password.length < 8 || password.length > 30) {
    return { error: "비밀번호는 8~30자로 입력해주세요." };
  }
  if (password !== confirmPassword) {
    return { error: "비밀번호가 일치하지 않습니다." };
  }

  const vt = await prisma.verificationToken.findUnique({ where: { token } });
  if (!vt || vt.expires < new Date()) {
    return {
      error:
        "링크가 만료되었거나 유효하지 않습니다. 비밀번호 찾기를 다시 요청해주세요.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { email: vt.identifier },
      data: { passwordHash },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);

  return { success: true, message: "비밀번호가 재설정되었습니다. 로그인해주세요." };
}
