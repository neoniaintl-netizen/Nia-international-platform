"use client";

import { formatPrice, getDiscountRate } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useKrwPerCny, formatCny } from "@/components/providers/currency-provider";

interface PriceDisplayProps {
  basePrice: number;
  salePrice?: number | null;
  size?: "sm" | "md" | "lg";
}

export function PriceDisplay({
  basePrice,
  salePrice,
  size = "md",
}: PriceDisplayProps) {
  // 알리/위챗 실결제 통화(CNY) 환산가 — 결제와 동일 환율 (미설정이면 숨김)
  const krwPerCny = useKrwPerCny();
  const hasDiscount = salePrice != null && salePrice < basePrice;
  const discountRate = hasDiscount ? getDiscountRate(basePrice, salePrice) : 0;
  const displayPrice = hasDiscount ? salePrice : basePrice;

  const sizeStyles = {
    sm: { price: "text-[13px]", discount: "text-[13px]", original: "text-[11px]", cny: "text-[10px]" },
    md: { price: "text-[15px]", discount: "text-[15px]", original: "text-xs", cny: "text-[11px]" },
    lg: { price: "text-2xl", discount: "text-2xl", original: "text-sm", cny: "text-sm" },
  };

  const styles = sizeStyles[size];

  return (
    <div className="flex items-baseline gap-2 flex-wrap num">
      {hasDiscount && (
        <span
          className={cn(
            "font-semibold text-[var(--champagne)] tracking-tight",
            styles.discount
          )}
        >
          {discountRate}%
        </span>
      )}
      <span
        className={cn(
          "font-semibold text-[var(--ink)] tracking-tight",
          styles.price
        )}
      >
        {formatPrice(displayPrice)}
      </span>
      {hasDiscount && (
        <span
          className={cn(
            "text-[var(--ink-muted)]/60 line-through",
            styles.original
          )}
        >
          {formatPrice(basePrice)}
        </span>
      )}
      {krwPerCny && (
        <span className={cn("text-[var(--ink-muted)]/70", styles.cny)}>
          ≈ {formatCny(displayPrice / krwPerCny)}
        </span>
      )}
    </div>
  );
}
