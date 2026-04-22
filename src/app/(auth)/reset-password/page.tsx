"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetPasswordAction } from "@/actions/auth";
import { CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    null
  );
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  if (!token) {
    return (
      <div className="bg-red-50 rounded-xl p-6 text-center">
        <p className="text-sm text-red-700">유효하지 않은 접근입니다.</p>
        <Link
          href="/forgot-password"
          className="inline-block mt-4 text-xs font-bold text-red-700 underline"
        >
          비밀번호 찾기로 이동
        </Link>
      </div>
    );
  }

  if ((state as any)?.success) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-600" />
        <p className="text-sm text-gray-700">{(state as any).message}</p>
        <Link
          href="/login"
          className="block mt-6 h-11 bg-black text-white rounded-lg flex items-center justify-center text-sm font-bold"
        >
          로그인
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Input
        name="password"
        type="password"
        placeholder="새 비밀번호 (8~30자)"
        className="h-12 bg-gray-50 border-gray-200 rounded-lg text-sm"
        required
        minLength={8}
        maxLength={30}
      />
      <Input
        name="confirmPassword"
        type="password"
        placeholder="새 비밀번호 확인"
        className="h-12 bg-gray-50 border-gray-200 rounded-lg text-sm"
        required
      />

      {state?.error && (
        <p className="text-sm text-[var(--sale)] text-center">{state.error}</p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-12 bg-black hover:bg-gray-800 text-white font-bold text-sm rounded-lg"
      >
        {isPending ? "변경 중..." : "비밀번호 변경"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-sm mx-auto">
      <h1 className="text-2xl font-black text-center mb-8">비밀번호 재설정</h1>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
