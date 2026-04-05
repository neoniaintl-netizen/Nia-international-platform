"use client";

import { useState } from "react";
import Link from "next/link";
import { X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_TREE } from "@/lib/constants";

interface CategoryMenuProps {
  open: boolean;
  onClose: () => void;
}

export function CategoryMenu({ open, onClose }: CategoryMenuProps) {
  const [activeTab, setActiveTab] = useState<"category" | "brand" | "service">("category");
  const [activeCategory, setActiveCategory] = useState(0);

  if (!open) return null;

  const currentCategory = CATEGORY_TREE[activeCategory];

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black/40 z-[60]"
        onClick={onClose}
      />

      {/* 팝업 패널 */}
      <div className="fixed top-0 left-0 w-full max-w-[720px] h-full bg-white z-[70] shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
        {/* 상단 탭 */}
        <div className="flex items-center justify-between border-b px-6 h-14 shrink-0">
          <div className="flex items-center gap-6">
            {(
              [
                { key: "category", label: "카테고리" },
                { key: "brand", label: "브랜드" },
                { key: "service", label: "서비스" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "text-sm font-bold pb-0.5 transition-colors",
                  activeTab === tab.key
                    ? "text-black border-b-2 border-black"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "category" && (
            <div className="flex h-full">
              {/* 좌측: 대분류 카테고리 */}
              <div className="w-[160px] border-r bg-gray-50 overflow-y-auto shrink-0">
                {CATEGORY_TREE.map((cat, idx) => (
                  <button
                    key={cat.slug}
                    onClick={() => setActiveCategory(idx)}
                    className={cn(
                      "w-full text-left px-5 py-3.5 text-sm transition-colors",
                      activeCategory === idx
                        ? "bg-white font-bold text-black border-r-2 border-black"
                        : "text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* 우측: 하위 카테고리 */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* 대분류 헤더 */}
                <Link
                  href={`/category/${currentCategory.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-2 mb-6 group"
                >
                  <span className="text-lg font-bold group-hover:underline">
                    {currentCategory.name}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>

                {/* 버튼: 신상품 보기 / 전체 보기 */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <Link
                    href={`/category/${currentCategory.slug}?sort=newest`}
                    onClick={onClose}
                    className="flex items-center justify-center h-10 border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    신상품 보기
                  </Link>
                  <Link
                    href={`/category/${currentCategory.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-center h-10 border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    전체 보기
                  </Link>
                </div>

                {/* 하위 카테고리 그리드 */}
                <div className="grid grid-cols-3 gap-x-4 gap-y-5">
                  {currentCategory.sub.map((sub) => (
                    <Link
                      key={sub.slug}
                      href={`/category/${sub.slug}`}
                      onClick={onClose}
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        <span className="text-xs text-gray-500 font-medium">
                          {sub.name.slice(0, 2)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600 group-hover:text-black text-center transition-colors">
                        {sub.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "brand" && (
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                {["전체", "의류", "신발", "뷰티"].map((tab) => (
                  <button
                    key={tab}
                    className="text-sm font-medium text-gray-400 hover:text-black transition-colors first:text-black first:font-bold"
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-400">
                브랜드 목록은 상품 등록 시 자동으로 추가됩니다.
              </p>
            </div>
          )}

          {activeTab === "service" && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-400">준비 중인 서비스입니다.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
