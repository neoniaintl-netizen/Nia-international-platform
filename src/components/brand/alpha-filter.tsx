"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const LETTERS = [
  "인기",
  "A","B","C","D","E","F","G","H","I","J","K","L","M",
  "N","O","P","Q","R","S","T","U","V","W","X","Y","Z",
];

export function AlphaFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeLetter = searchParams.get("letter") ?? "";

  function handleClick(letter: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (letter === activeLetter) {
      // 이미 선택된 필터 클릭 → 해제
      params.delete("letter");
    } else {
      params.set("letter", letter);
    }
    // 알파벳 필터 시 검색어 초기화
    params.delete("q");
    router.push(`/brands?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-1 mb-8">
      {LETTERS.map((letter) => (
        <button
          key={letter}
          onClick={() => handleClick(letter)}
          className={cn(
            "w-8 h-8 text-xs rounded flex items-center justify-center transition-colors",
            activeLetter === letter
              ? "bg-black text-white"
              : "hover:bg-gray-100 text-gray-500 hover:text-black"
          )}
        >
          {letter}
        </button>
      ))}
    </div>
  );
}
