"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
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

const BRAND_FILTERS: { key: BrandFilter; labelKey: string }[] = [
  { key: "all", labelKey: "filterAll" },
  { key: "apparel", labelKey: "filterApparel" },
  { key: "shoes", labelKey: "filterShoes" },
  { key: "beauty", labelKey: "filterBeauty" },
];

export function CategoryMenu({
  open,
  onClose,
  brands = [],
  categories = [],
}: CategoryMenuProps) {
  const t = useTranslations("CategoryMenu");
  const tCat = useTranslations("Category");
  // 카테고리명 다국어: Category 네임스페이스에 slug 키가 있으면 번역, 없으면 DB명(신규 카테고리 안전).
  const catLabel = (slug: string, name: string) => (tCat.has(slug) ? tCat(slug) : name);
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
                { key: "category", labelKey: "tabCategory" },
                { key: "brand", labelKey: "tabBrand" },
                { key: "service", labelKey: "tabService" },
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
                {t(tab.labelKey)}
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
                    {catLabel(cat.slug, cat.name)}
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
                        {catLabel(currentCategory.slug, currentCategory.name)}
                      </span>
                      {currentCategory.productCount > 0 && (
                        <span className="text-xs text-gray-400">
                          {t("itemCount", { count: currentCategory.productCount })}
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
                        {t("viewNew")}
                      </Link>
                      <Link
                        href={`/category/${currentCategory.slug}`}
                        onClick={onClose}
                        className="flex items-center justify-center h-10 border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        {t("viewAll")}
                      </Link>
                    </div>

                    {/* 하위 카테고리 그리드 */}
                    {currentCategory.sub.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-12">
                        {t("categoryEmpty")}
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
                                {catLabel(sub.slug, sub.name).replace(/^(골프|아웃도어|스포츠)\s*/, "").slice(0, 3)}
                              </span>
                            </div>
                            <span className="text-xs text-gray-700 group-hover:text-black text-center transition-colors">
                              {catLabel(sub.slug, sub.name)}
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
                    {t("categoryLoadError")}
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
                    {t(tab.labelKey)}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                {filteredBrands.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-12">
                    {t("brandEmpty")}
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
                          {t("productCount", { count: b.productCount })}
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
                  <h4 className="text-sm font-bold text-gray-900 mb-1">{t("svc1Title")}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{t("svc1Desc")}</p>
                </div>
                <div className="border rounded-lg p-4 hover:border-black transition-colors cursor-pointer">
                  <h4 className="text-sm font-bold text-gray-900 mb-1">{t("svc2Title")}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{t("svc2Desc")}</p>
                </div>
                <div className="border rounded-lg p-4 hover:border-black transition-colors cursor-pointer">
                  <h4 className="text-sm font-bold text-gray-900 mb-1">{t("svc3Title")}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{t("svc3Desc")}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
