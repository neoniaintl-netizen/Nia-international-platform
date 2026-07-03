"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * 전역 에러 경계 — 서버 컴포넌트/데이터 조회 실패 시 Next 기본 에러 화면 대신
 * 브랜드 톤의 안내 + 재시도 버튼을 보여준다.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <p className="text-xs font-black tracking-[0.3em] text-gray-300 mb-4">NOVAREN</p>
      <h1 className="text-xl font-bold mb-2">일시적인 오류가 발생했습니다</h1>
      <p className="text-sm text-gray-500 leading-relaxed mb-8">
        잠시 후 다시 시도해주세요.
        <br />
        문제가 계속되면 고객센터(1544-7199)로 문의해주세요.
      </p>
      <div className="flex gap-3 justify-center">
        <Button onClick={reset} className="h-11 bg-black text-white hover:bg-gray-800">
          다시 시도
        </Button>
        <Link href="/">
          <Button variant="outline" className="h-11">홈으로</Button>
        </Link>
      </div>
      {error.digest && (
        <p className="text-[11px] text-gray-300 mt-8">오류 코드: {error.digest}</p>
      )}
    </div>
  );
}
