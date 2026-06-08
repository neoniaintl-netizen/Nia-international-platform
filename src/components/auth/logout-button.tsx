"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 로그아웃 버튼 — 클라이언트 signOut(next-auth/react) + 하드 리로드.
 *
 * 세션 쿠키를 만료시킨 뒤 window.location 으로 "/" 를 하드 리로드한다.
 * 하드 리로드로 (1) 헤더 아바타 갱신, (2) Next Router 캐시 무효화를 함께 처리한다.
 * (서버액션 logoutAction 은 헤더가 안 바뀌고, 클라이언트 signOut 소프트 리다이렉트만으로는
 *  로그인 중 prefetch 된 "/login→홈" 리다이렉트 캐시가 남아 로그인 링크가 홈으로 튕긴다.)
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
  const handleLogout = async () => {
    // 1) 세션 쿠키만 만료 (next-auth 자체 리다이렉트는 끔)
    await signOut({ redirect: false });
    // 2) 하드 리로드로 "/" 이동 → Next Router 캐시까지 비운다.
    //    (소프트 네비게이션이면, 로그인 중 prefetch 된 "/login→홈" 미들웨어 리다이렉트가
    //     캐시에 남아 로그아웃 후 로그인 링크 클릭 시 홈으로 튕기는 문제가 생김.
    //     헤더 아바타가 안 바뀌는 문제도 전체 새로고침으로 함께 해결됨.)
    window.location.replace("/");
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
