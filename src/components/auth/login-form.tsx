"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";
import { safeCallbackUrl } from "@/lib/utils";

/**
 * 로그인 폼 — 클라이언트 signIn(next-auth/react, redirect:false) + 소프트 전환.
 *
 * signIn(redirect:false)은 세션 쿠키를 설정하고 useSession 을 자동 갱신한다(Auth.js 공식 동작).
 * 따라서 풀페이지 하드 리로드 없이 헤더가 즉시 로그인 상태(아바타/마이페이지)로 바뀐다. 이후
 *   - router.push(목적지) : 소프트 전환(풀 리로드 X → 흰 화면 깜빡임/버벅임 제거).
 *     홈은 dynamic(auth())이라 새 쿠키로 재요청 → 장바구니 수 등 서버 컴포넌트도 최신화.
 * (이전 서버액션 방식은 소프트 리다이렉트라 useSession 이 안 바뀌어 헤더가 로그아웃 상태로
 *  남는 버그가 있었음 → 클라이언트 signIn 으로 useSession 자동 갱신을 보장.)
 */
export function LoginForm() {
  const router = useRouter();
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
      // 성공 — 소프트 전환(풀 리로드 X). signIn(redirect:false)이 useSession 을 자동 갱신해
      // 헤더가 즉시 로그인 상태로 바뀐다. 홈은 dynamic(auth())이라 push 시 새 쿠키로 재요청되어
      // 장바구니 수 등 서버 컴포넌트도 최신화된다.
      router.push(callbackUrl || "/");
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
