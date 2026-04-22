"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { findIdAction } from "@/actions/auth";
import { CheckCircle2 } from "lucide-react";

export default function FindIdPage() {
  const [state, formAction, isPending] = useActionState(findIdAction, null);

  return (
    <div className="w-full max-w-sm mx-auto">
      <h1 className="text-2xl font-black text-center mb-2">아이디 찾기</h1>
      <p className="text-center text-xs text-gray-500 mb-8">
        가입 시 등록한 이름과 휴대폰 번호를 입력해주세요
      </p>

      {(state as any)?.success ? (
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-600" />
          <p className="text-xs text-gray-500 mb-1">고객님의 아이디</p>
          <p className="text-lg font-bold">{(state as any).email}</p>
          <p className="text-[11px] text-gray-400 mt-2">
            가입일: {(state as any).createdAt}
          </p>
          <div className="flex gap-2 mt-6">
            <Link
              href="/login"
              className="flex-1 h-11 bg-black text-white rounded-lg flex items-center justify-center text-sm font-bold"
            >
              로그인
            </Link>
            <Link
              href="/forgot-password"
              className="flex-1 h-11 bg-white border border-gray-300 rounded-lg flex items-center justify-center text-sm font-bold"
            >
              비밀번호 찾기
            </Link>
          </div>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <Input
            name="name"
            placeholder="이름"
            className="h-12 bg-gray-50 border-gray-200 rounded-lg text-sm"
            required
          />
          <Input
            name="phone"
            type="tel"
            placeholder="휴대폰 번호 (-없이)"
            className="h-12 bg-gray-50 border-gray-200 rounded-lg text-sm"
            required
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
            {isPending ? "조회 중..." : "아이디 찾기"}
          </Button>
        </form>
      )}

      <div className="flex items-center justify-center gap-4 mt-6 text-xs text-gray-400">
        <Link href="/login" className="hover:text-black">
          로그인
        </Link>
        <span>|</span>
        <Link href="/forgot-password" className="hover:text-black">
          비밀번호 찾기
        </Link>
        <span>|</span>
        <Link href="/register" className="hover:text-black">
          회원가입
        </Link>
      </div>
    </div>
  );
}
