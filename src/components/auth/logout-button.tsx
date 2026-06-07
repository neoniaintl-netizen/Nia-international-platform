"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 로그아웃 버튼 — 클라이언트 signOut(next-auth/react) 기반.
 *
 * 세션 쿠키를 만료시키고 useSession 구독자(헤더 아바타 등)를 즉시 갱신한 뒤 "/" 로 이동한다.
 * (서버액션 logoutAction 은 쿠키는 지우지만 RootLayout 의 SessionProvider 초기값이
 *  갱신되지 않아, 로그아웃 후에도 헤더가 로그인 상태로 남는 문제가 있어 클라이언트 signOut 으로 전환.)
 *
 *  - variant="icon": 헤더용 아이콘 버튼
 *  - variant="row":  마이페이지 메뉴 행
 */
export function LogoutButton({
  variant = "icon",
  className,
}: {
  variant?: "icon" | "row";
  className?: string;
}) {
  const handleLogout = () => {
    void signOut({ callbackUrl: "/" });
  };

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        className={cn(
          "w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors text-left",
          className
        )}
      >
        <LogOut className="w-5 h-5 text-gray-400 shrink-0" strokeWidth={1.5} />
        <span className="flex-1 text-[14px] font-medium text-gray-700">로그아웃</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      aria-label="로그아웃"
      className={cn("text-gray-400 hover:text-black transition-colors", className)}
    >
      <LogOut className="w-[17px] h-[17px]" strokeWidth={1.6} />
    </button>
  );
}
