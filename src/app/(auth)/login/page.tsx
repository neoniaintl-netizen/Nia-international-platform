"use client";

import { Suspense } from "react";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { loginAction } from "@/actions/auth";
import { SocialLoginButton } from "@/components/auth/social-login-button";
import { Gift } from "lucide-react";

function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  return (
    <div className="w-full max-w-sm mx-auto">
      <h1 className="text-2xl font-black text-center mb-8">로그인</h1>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Input
          name="email"
          type="email"
          placeholder="이메일을 입력해 주세요"
          className="h-12 bg-gray-50 border-gray-200 rounded-lg text-sm"
          required
          autoComplete="email"
        />
        <Input
          name="password"
          type="password"
          placeholder="비밀번호를 입력해 주세요"
          className="h-12 bg-gray-50 border-gray-200 rounded-lg text-sm"
          required
          autoComplete="current-password"
        />

        {state?.error && (
          <p className="text-sm text-[var(--sale)] text-center">{state.error}</p>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-12 bg-black hover:bg-gray-800 text-white font-bold text-sm rounded-lg"
        >
          {isPending ? "로그인 중..." : "로그인"}
        </Button>
      </form>

      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
        <Link href="/find-id" className="hover:text-black transition-colors">아이디 찾기</Link>
        <span>|</span>
        <Link href="/forgot-password" className="hover:text-black transition-colors">비밀번호 찾기</Link>
        <span>|</span>
        <Link href="/register" className="hover:text-black transition-colors">회원가입</Link>
      </div>

      <div className="text-center mt-3">
        <Link href="/order-lookup" className="text-xs text-gray-400 hover:text-black underline">
          비회원 주문조회
        </Link>
      </div>

      <div className="relative my-8">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-gray-400">
          또는
        </span>
      </div>

      <div className="space-y-3">
        <SocialLoginButton provider="kakao" />
        <SocialLoginButton provider="naver" />
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-xl text-center">
        <Gift className="w-5 h-5 mx-auto mb-2 text-[var(--sale)]" />
        <p className="text-xs text-gray-600 mb-1">지금 가입하면</p>
        <p className="text-sm font-bold">신규 회원 할인 쿠폰 즉시 발급!</p>
        <Link
          href="/register"
          className="inline-block mt-3 text-xs font-bold text-[var(--sale)] hover:underline"
        >
          회원가입 하기 →
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
