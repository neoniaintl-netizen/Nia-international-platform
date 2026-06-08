"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 로그아웃 버튼 — 클라이언트 signOut(next-auth/react, 라우트 핸들러) + 하드 리로드.
 *
 * 이 배포 환경에서 "서버액션" POST(logoutAction)가 실패(503)해 세션이 안 끊기는 문제가
 * 라이브에서 확인됨. 반면 NextAuth signout "라우트 핸들러"(/api/auth/signout)는 정상 동작
 * (세션 클리어 라이브 확인). 따라서 라우트 핸들러를 쓰는 클라이언트 signOut 으로 세션 쿠키를
 * 만료시킨 뒤 window.location 으로 하드 리로드한다.
 *  - 하드 리로드 → 헤더 갱신(아바타→로그인 아이콘) + Next Router 캐시 무효화.
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
      await signOut({ redirect: false }); // 라우트 핸들러로 세션 쿠키 만료
    } catch {
      // 무시 — 어떤 경우든 하드 리로드로 로그아웃 상태 재로드
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
