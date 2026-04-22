import { formatPrice, getDiscountRate } from "@/lib/constants";
import { cn } from "@/lib/utils";

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
  const hasDiscount = salePrice != null && salePrice < basePrice;
  const discountRate = hasDiscount ? getDiscountRate(basePrice, salePrice) : 0;
  const displayPrice = hasDiscount ? salePrice : basePrice;

  const sizeStyles = {
    sm: { price: "text-[13px]", discount: "text-[13px]", original: "text-[11px]" },
    md: { price: "text-[15px]", discount: "text-[15px]", original: "text-xs" },
    lg: { price: "text-2xl", discount: "text-2xl", original: "text-sm" },
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
    </div>
  );
}
