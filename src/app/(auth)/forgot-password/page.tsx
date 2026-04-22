"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requestPasswordResetAction } from "@/actions/auth";
import { CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordResetAction,
    null
  );

  return (
    <div className="w-full max-w-sm mx-auto">
      <h1 className="text-2xl font-black text-center mb-2">비밀번호 찾기</h1>
      <p className="text-center text-xs text-gray-500 mb-8">
        가입한 이메일 주소로 재설정 링크를 보내드립니다
      </p>

      {(state as any)?.success ? (
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-600" />
          <p className="text-sm text-gray-700">{(state as any).message}</p>
          <Link
            href="/login"
            className="block mt-6 h-11 bg-black text-white rounded-lg flex items-center justify-center text-sm font-bold"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <Input
            name="email"
            type="email"
            placeholder="이메일을 입력해 주세요"
            className="h-12 bg-gray-50 border-gray-200 rounded-lg text-sm"
            required
            autoComplete="email"
          />

          {state?.error && (
            <p className="text-sm text-[var(--sale)] text-center">
              {state.error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-12 bg-black hover:bg-gray-800 text-white font-bold text-sm rounded-lg"
          >
            {isPending ? "발송 중..." : "재설정 링크 받기"}
          </Button>
        </form>
      )}

      <div className="flex items-center justify-center gap-4 mt-6 text-xs text-gray-400">
        <Link href="/login" className="hover:text-black">
          로그인
        </Link>
        <span>|</span>
        <Link href="/find-id" className="hover:text-black">
          아이디 찾기
        </Link>
        <span>|</span>
        <Link href="/register" className="hover:text-black">
          회원가입
        </Link>
      </div>

      <p className="text-[11px] text-gray-400 text-center mt-8 leading-relaxed">
        메일이 오지 않는 경우 스팸함을 확인해주세요.
        <br />
        계속 문제가 발생하면 고객센터 1544-7199로 문의해주세요.
      </p>
    </div>
  );
}
