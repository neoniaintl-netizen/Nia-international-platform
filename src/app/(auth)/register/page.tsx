"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { registerAction } from "@/actions/auth";
import { SocialLoginButton } from "@/components/auth/social-login-button";
import { Separator } from "@/components/ui/separator";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, null);

  return (
    <div className="w-full max-w-sm mx-auto">
      <h1 className="text-2xl font-black text-center mb-8">회원가입</h1>

      <form action={formAction} className="space-y-5">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">
            이메일 <span className="text-[var(--sale)]">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="이메일을 입력해 주세요"
            className="h-12 bg-gray-50 border-gray-200 rounded-lg text-sm"
            required
            autoComplete="email"
          />
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium">
            이름 <span className="text-[var(--sale)]">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="이름을 입력해 주세요"
            className="h-12 bg-gray-50 border-gray-200 rounded-lg text-sm"
            required
            autoComplete="name"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium">
            비밀번호 <span className="text-[var(--sale)]">*</span>
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="8~30자 영문/숫자/특수문자 조합"
            className="h-12 bg-gray-50 border-gray-200 rounded-lg text-sm"
            required
            minLength={8}
            maxLength={30}
            autoComplete="new-password"
          />
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            비밀번호 확인 <span className="text-[var(--sale)]">*</span>
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="비밀번호를 다시 입력해 주세요"
            className="h-12 bg-gray-50 border-gray-200 rounded-lg text-sm"
            required
            autoComplete="new-password"
          />
        </div>

        {/* Terms */}
        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="agreeTerms"
              required
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
            />
            <span className="text-xs text-gray-600">
              <span className="text-[var(--sale)]">[필수]</span> 이용약관에 동의합니다
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="agreePrivacy"
              required
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
            />
            <span className="text-xs text-gray-600">
              <span className="text-[var(--sale)]">[필수]</span> 개인정보 수집 및 이용에 동의합니다
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="agreeMarketing"
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
            />
            <span className="text-xs text-gray-600">
              [선택] 마케팅 정보 수신에 동의합니다
            </span>
          </label>
        </div>

        {/* Error */}
        {state?.error && (
          <p className="text-sm text-[var(--sale)] text-center">{state.error}</p>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-12 bg-black hover:bg-gray-800 text-white font-bold text-sm rounded-lg"
        >
          {isPending ? "가입 중..." : "가입하기"}
        </Button>
      </form>

      <div className="relative my-8">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-gray-400">
          간편 가입
        </span>
      </div>

      <div className="space-y-3">
        <SocialLoginButton provider="kakao" />
        <SocialLoginButton provider="naver" />
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-bold text-black hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
