"use client";

import { logoutAction } from "@/actions/auth";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 로그아웃 버튼 — 서버액션(logoutAction) 기반.
 * 서버에서 세션 쿠키를 만료시키고 "/" 로 리다이렉트하므로 클라이언트 signOut 보다 견고.
 * (JS 없이 form submit 만으로도 동작)
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
  if (variant === "row") {
    return (
      <form action={logoutAction}>
        <button
          type="submit"
          className={cn(
            "w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors text-left",
            className
          )}
        >
          <LogOut className="w-5 h-5 text-gray-400 shrink-0" strokeWidth={1.5} />
          <span className="flex-1 text-[14px] font-medium text-gray-700">로그아웃</span>
        </button>
      </form>
    );
  }

  return (
    <form action={logoutAction} className="contents">
      <button
        type="submit"
        aria-label="로그아웃"
        className={cn("text-gray-400 hover:text-black transition-colors", className)}
      >
        <LogOut className="w-[17px] h-[17px]" strokeWidth={1.6} />
      </button>
    </form>
  );
}
