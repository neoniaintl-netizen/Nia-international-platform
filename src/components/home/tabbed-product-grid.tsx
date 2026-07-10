"use client";

import { useState } from "react";
import { ProductCard, type ProductCardData } from "@/components/product/product-card";
import { SectionHeader } from "@/components/home/section-header";
import { cn } from "@/lib/utils";

export interface ProductTab {
  key: string;
  label: string;
  products: ProductCardData[];
}

interface TabbedProductGridProps {
  tabs: ProductTab[];
  eyebrow?: string;
  title: string;
  subtitle?: string;
  linkHref?: string;
  linkLabel?: string;
  /** 카드에 1..N 순위 번호(No.01) 배지 표시 (예: NEW 랭킹) */
  numbered?: boolean;
  columns?: 4 | 5;
}

/**
 * 칩 형태 탭으로 필터되는 상품 그리드.
 * 탭 전환만 클라이언트 상태 — 데이터는 서버에서 이미 각 탭별로 준비해 props로 내려받음.
 * 모바일 2열 → md 3열 → lg 4~5열.
 */
export function TabbedProductGrid({
  tabs,
  eyebrow,
  title,
  subtitle,
  linkHref,
  linkLabel,
  numbered = false,
  columns = 5,
}: TabbedProductGridProps) {
  const available = tabs.filter((t) => t.products.length > 0);
  const [active, setActive] = useState(available[0]?.key ?? "");
  if (available.length === 0) return null;

  const current = available.find((t) => t.key === active) ?? available[0];

  return (
    <section className="max-w-[1360px] mx-auto px-4 lg:px-8 py-12 lg:py-20">
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        linkHref={linkHref}
        linkLabel={linkLabel}
      />

      {/* 칩 탭 */}
      {available.length > 1 && (
        <div className="-mx-4 px-4 lg:mx-0 lg:px-0 mb-7 lg:mb-9">
          <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {available.map((t) => {
              const isActive = t.key === current.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActive(t.key)}
                  className={cn(
                    "shrink-0 px-4 py-2 text-[12px] tracking-[0.08em] whitespace-nowrap border transition-colors",
                    isActive
                      ? "bg-[var(--ink)] text-white border-[var(--ink)]"
                      : "bg-white text-[var(--ink-muted)] border-[var(--line)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 그리드 */}
      <div
        className={cn(
          "grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-8 sm:gap-x-4 lg:gap-y-11",
          columns === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4"
        )}
      >
        {current.products.map((p, i) => (
          <ProductCard
            key={p.id}
            product={p}
            rank={numbered ? i + 1 : undefined}
            priority={i < 5}
          />
        ))}
      </div>
    </section>
  );
}
