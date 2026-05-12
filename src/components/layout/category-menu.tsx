"use client";

import { useState } from "react";
import Link from "next/link";
import { X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MenuBrand, MenuCategory } from "@/lib/queries";

interface CategoryMenuProps {
  open: boolean;
  onClose: () => void;
  brands?: MenuBrand[];
  categories?: MenuCategory[];
}

type BrandFilter = "all" | "apparel" | "shoes" | "beauty";

const BRAND_FILTERS: { key: BrandFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "apparel", label: "의류" },
  { key: "shoes", label: "신발" },
  { key: "beauty", label: "뷰티" },
];

export function CategoryMenu({
  open,
  onClose,
  brands = [],
  categories = [],
}: CategoryMenuProps) {
  const [activeTab, setActiveTab] = useState<"category" | "brand" | "service">("category");
  const [activeCategory, setActiveCategory] = useState(0);
  const [brandFilter, setBrandFilter] = useState<BrandFilter>("all");

  if (!open) return null;

  const currentCategory = categories[activeCategory];
  const filteredBrands =
    brandFilter === "all"
      ? brands
      : brands.filter((b) => b.channel === brandFilter);

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
                {categories.map((cat, idx) => (
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
                    {cat.productCount > 0 && (
                      <span className="ml-1.5 text-[10px] text-gray-400">
                        {cat.productCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* 우측: 하위 카테고리 */}
              <div className="flex-1 overflow-y-auto p-6">
                {currentCategory ? (
                  <>
                    {/* 대분류 헤더 */}
                    <Link
                      href={`/category/${currentCategory.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-2 mb-6 group"
                    >
                      <span className="text-lg font-bold group-hover:underline">
                        {currentCategory.name}
                      </span>
                      {currentCategory.productCount > 0 && (
                        <span className="text-xs text-gray-400">
                          {currentCategory.productCount}개
                        </span>
                      )}
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
                    {currentCategory.sub.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-12">
                        준비 중인 카테고리입니다.
                      </p>
                    ) : (
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
                                {sub.name.replace(/^(골프|아웃도어|스포츠)\s*/, "").slice(0, 3)}
                              </span>
                            </div>
                            <span className="text-xs text-gray-700 group-hover:text-black text-center transition-colors">
                              {sub.name}
                              <span className="ml-1 text-[10px] text-gray-400">
                                {sub.productCount}
                              </span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400">
                    카테고리 정보를 불러올 수 없습니다.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "brand" && (
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-5 px-6 pt-6 pb-4 border-b shrink-0">
                {BRAND_FILTERS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setBrandFilter(tab.key)}
                    className={cn(
                      "text-sm transition-colors pb-1",
                      brandFilter === tab.key
                        ? "text-black font-bold border-b-2 border-black"
                        : "text-gray-400 font-medium hover:text-gray-600"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                {filteredBrands.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-12">
                    준비 중인 브랜드입니다.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2">
                    {filteredBrands.map((b) => (
                      <Link
                        key={b.slug}
                        href={`/brands/${b.slug}`}
                        onClick={onClose}
                        className="flex flex-col gap-0.5 py-3 px-3 hover:bg-gray-50 rounded-lg transition-colors group"
                      >
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-black">
                          {b.name}
                        </span>
                        {b.nameKo && (
                          <span className="text-xs text-gray-500">
                            {b.nameKo}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 mt-0.5">
                          {b.productCount}개 상품
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "service" && (
            <div className="px-4 py-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="border rounded-lg p-4 hover:border-black transition-colors cursor-pointer">
                  <h4 className="text-sm font-bold text-gray-900 mb-1">구매대행 서비스</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">한국 브랜드를 중국 시장에 수출하는 구매대행 서비스를 제공합니다.</p>
                </div>
                <div className="border rounded-lg p-4 hover:border-black transition-colors cursor-pointer">
                  <h4 className="text-sm font-bold text-gray-900 mb-1">해외배송 안내</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">중국 전역 배송 지원. EMS, 항공특송, 해상운송 등 다양한 배송 옵션.</p>
                </div>
                <div className="border rounded-lg p-4 hover:border-black transition-colors cursor-pointer">
                  <h4 className="text-sm font-bold text-gray-900 mb-1">브랜드 입점 안내</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">중국 플랫폼 입점을 원하는 한국 브랜드를 위한 입점 가이드.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
