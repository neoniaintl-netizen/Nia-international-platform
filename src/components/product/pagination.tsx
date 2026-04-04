"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  total: number;
  pageSize?: number;
}

export function Pagination({ total, pageSize = 20 }: PaginationProps) {
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page") || "1");
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  // 현재 페이지 기준 표시할 페이지 번호들 (최대 5개)
  const getPageNumbers = () => {
    const pages: number[] = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);

    // start 보정
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const qs = params.toString();
    return qs ? `?${qs}` : "?";
  };

  const pages = getPageNumbers();

  return (
    <nav className="flex items-center justify-center gap-1 mt-10 mb-4">
      {/* 첫 페이지 */}
      {currentPage > 3 && (
        <Link
          href={createPageUrl(1)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          aria-label="첫 페이지"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Link>
      )}

      {/* 이전 */}
      {currentPage > 1 && (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          aria-label="이전 페이지"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
      )}

      {/* 페이지 번호 */}
      {pages.map((page) => (
        <Link
          key={page}
          href={createPageUrl(page)}
          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
            page === currentPage
              ? "bg-black text-white"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          {page}
        </Link>
      ))}

      {/* 다음 */}
      {currentPage < totalPages && (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          aria-label="다음 페이지"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}

      {/* 마지막 페이지 */}
      {currentPage < totalPages - 2 && (
        <Link
          href={createPageUrl(totalPages)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          aria-label="마지막 페이지"
        >
          <ChevronsRight className="w-4 h-4" />
        </Link>
      )}
    </nav>
  );
}
