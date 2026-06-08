"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 로그아웃 버튼 — 클라이언트 signOut(next-auth/react, redirect:false) + 소프트 전환.
 *
 * signOut(redirect:false)은 세션을 삭제하고 useSession 을 자동 갱신한다(Auth.js 공식 동작).
 * 따라서 풀페이지 하드 리로드 없이 헤더가 즉시 로그아웃 상태로 바뀐다. 이후
 *   - router.replace("/") : 소프트 전환(풀 리로드 X → 흰 화면 깜빡임/버벅임 제거).
 *     홈은 dynamic(auth())이라 새 쿠키로 재요청 → 장바구니 수 등 서버 컴포넌트도 최신화.
 * (router.refresh 는 안 씀: 보호페이지(/my 등)에서 로그아웃 시 refresh 가 그 페이지를 재요청해
 *  미들웨어가 /login 으로 튕기는 레이스를 피하기 위함.)
 * 드물게 signOut 자체가 실패하면 window.location 하드 리로드로 폴백한다.
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
  const router = useRouter();
  const handleLogout = async () => {
    try {
      await signOut({ redirect: false }); // 세션 삭제 + useSession 자동 갱신(헤더 즉시 로그아웃)
      router.replace("/"); // 소프트 전환(풀 리로드 X). 홈은 dynamic 이라 새 쿠키로 재요청됨.
    } catch {
      window.location.replace("/"); // 드물게 signOut 실패 시 하드 리로드 폴백
    }
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
