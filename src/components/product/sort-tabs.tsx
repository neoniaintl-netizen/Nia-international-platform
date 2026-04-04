"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { key: "popular", label: "인기순" },
  { key: "newest", label: "최신순" },
  { key: "price_asc", label: "가격 낮은 순" },
  { key: "price_desc", label: "가격 높은 순" },
] as const;

export function SortTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSort = searchParams.get("sort") ?? "popular";

  function handleSort(sort: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === "popular") {
      params.delete("sort");
    } else {
      params.set("sort", sort);
    }
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-3">
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => handleSort(opt.key)}
          className={cn(
            "text-xs transition-colors",
            activeSort === opt.key
              ? "font-bold text-black"
              : "text-gray-400 hover:text-gray-600"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
