"use client";

import { logoutAction } from "@/actions/auth";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 로그아웃 버튼 — 서버 signOut(세션 쿠키 확실 만료) + 하드 리로드.
 *
 * 클라이언트 signOut(next-auth/react)은 이 환경(Auth.js v5 beta)에서 세션 쿠키를
 * 한 번에 못 끊는 경우가 있어(새로고침/재접속 시 로그인 유지), 서버 액션 logoutAction
 * (signOut)으로 쿠키를 확실히 만료시킨 뒤 window.location 으로 하드 리로드한다.
 *  - 하드 리로드 → 헤더 아바타 갱신 + Next Router 캐시 무효화(로그아웃 후 로그인 링크 정상화).
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
    try {
      await logoutAction(); // 서버에서 세션 쿠키 만료
    } catch {
      // 무시 — 어떤 경우에도 하드 리로드로 로그아웃 상태 재로드
    }
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
