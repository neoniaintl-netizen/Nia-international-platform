import { formatPrice, getDiscountRate } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  basePrice: number;
  salePrice?: number | null;
  size?: "sm" | "md" | "lg";
}

export function PriceDisplay({ basePrice, salePrice, size = "md" }: PriceDisplayProps) {
  const hasDiscount = salePrice != null && salePrice < basePrice;
  const discountRate = hasDiscount ? getDiscountRate(basePrice, salePrice) : 0;
  const displayPrice = hasDiscount ? salePrice : basePrice;

  const sizeStyles = {
    sm: { price: "text-sm", discount: "text-sm", original: "text-xs" },
    md: { price: "text-base", discount: "text-base", original: "text-xs" },
    lg: { price: "text-xl", discount: "text-xl", original: "text-sm" },
  };

  const styles = sizeStyles[size];

  return (
    <div className="flex items-baseline gap-1.5 flex-wrap">
      {hasDiscount && (
        <span className={cn("font-bold text-[var(--sale)]", styles.discount)}>
          {discountRate}%
        </span>
      )}
      <span className={cn("font-bold text-gray-900", styles.price)}>
        {formatPrice(displayPrice)}
      </span>
      {hasDiscount && (
        <span className={cn("text-gray-400 line-through", styles.original)}>
          {formatPrice(basePrice)}
        </span>
      )}
    </div>
  );
}
