"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";
import { safeCallbackUrl } from "@/lib/utils";

/**
 * 로그인 폼 — 클라이언트 signIn(next-auth/react) + 하드 리로드.
 *
 * 이전엔 서버액션 loginAction(signIn redirectTo)을 썼는데, 로그인 성공 후 "소프트"
 * 리다이렉트라 루트 레이아웃의 SessionProvider 가 로그아웃 세션을 그대로 유지 →
 * 헤더가 로그인 상태로 안 바뀌고(아바타 대신 로그인 아이콘), 그 아이콘을 누르면
 * 미들웨어가 홈으로 되돌려 "아무 동작 없음"처럼 보이는 문제가 있었다.
 * → 클라이언트 signOut 처럼, 로그인도 세션 쿠키를 설정한 뒤 window.location 으로
 *   하드 리로드해서 서버가 "로그인 세션"으로 새로 렌더하도록 한다.
 */
export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value?.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value;

    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setIsPending(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError("이메일 또는 비밀번호가 일치하지 않습니다.");
        setIsPending(false);
        return;
      }
      // 성공 — 하드 리로드로 이동(서버가 로그인 세션으로 재렌더 → 헤더 아바타/마이페이지 정상)
      window.location.assign(callbackUrl || "/");
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
      setIsPending(false);
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <h1 className="text-2xl font-black text-center mb-8">로그인</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        {error && (
          <p className="text-sm text-[var(--sale)] text-center">{error}</p>
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
