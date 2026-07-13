"use client";

import { useState, useTransition } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { addToCart } from "@/actions/cart";
import { toggleWishlist } from "@/actions/wishlist";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { ShareButton } from "@/components/shared/share-button";
import { SizeGuideModal } from "@/components/product/size-guide-modal";

interface Variant {
  id: string;
  color: string | null;
  size: string | null;
  stock: number;
  isActive: boolean;
}

interface ProductActionsProps {
  productId: string;
  productName: string;
  variants: Variant[];
  colors: string[];
  sizes: string[];
  isWishlisted: boolean;
  categorySlug?: string;
}

export function ProductActions({
  productId,
  productName,
  variants,
  colors,
  sizes,
  isWishlisted,
  categorySlug,
}: ProductActionsProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(
    colors.length === 1 ? colors[0] : null
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.length === 1 || (sizes.length === 1 && sizes[0] === "ONE SIZE")
      ? sizes[0]
      : null
  );
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [isPending, startTransition] = useTransition();
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname(); // 현재 상품 상세 경로(/products/{slug}) — callbackUrl 용
  const t = useTranslations("Pdp");

  function findVariant() {
    return variants.find((v) => {
      const colorMatch = !selectedColor || v.color === selectedColor;
      const sizeMatch = !selectedSize || v.size === selectedSize;
      return colorMatch && sizeMatch;
    });
  }

  function handleAddToCart() {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    const variant = findVariant();
    if (!variant) return toast.error(t("selectOption"));
    if (variant.stock <= 0) return toast.error(t("soldOutToast"));

    startTransition(async () => {
      try {
        const result = await addToCart(productId, variant.id);
        if (result?.error) {
          toast.error(result.error);
          return;
        }
        toast.success(t("addedToCart"), {
          action: {
            label: t("viewCart"),
            onClick: () => router.push("/cart"),
          },
        });
      } catch (e: any) {
        toast.error(e?.message ?? t("addToCartFailed"));
      }
    });
  }

  function handleBuyNow() {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    const variant = findVariant();
    if (!variant) return toast.error(t("selectOption"));

    startTransition(async () => {
      try {
        const result = await addToCart(productId, variant.id);
        if (result?.error) {
          toast.error(result.error);
          return;
        }
        // Buy Now: 방금 담은 항목만 결제 (장바구니 전체가 아니라)
        router.push(
          result?.cartItemId
            ? `/checkout?items=${result.cartItemId}`
            : "/checkout"
        );
      } catch (e: any) {
        toast.error(e?.message ?? t("actionFailed"));
      }
    });
  }

  function handleWishlist() {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    startTransition(async () => {
      try {
        const result = await toggleWishlist(productId);
        setWishlisted(result.wishlisted);
        toast(
          result.wishlisted
            ? t("wishAdded")
            : t("wishRemoved")
        );
      } catch (e: any) {
        toast.error(e?.message ?? t("wishFailed"));
      }
    });
  }

  const needsSelection =
    (colors.length > 1 && !selectedColor) ||
    (sizes.length > 1 && !selectedSize);

  return (
    <div className="space-y-7">
      {/* Color selection */}
      {colors.length > 0 && (
        <div>
          <p className="eyebrow text-[var(--ink)] mb-3">
            Color
            {selectedColor && (
              <span className="ml-2 text-[var(--ink-muted)] normal-case tracking-normal font-normal">
                · {selectedColor}
              </span>
            )}
          </p>
          <div className="flex gap-2 flex-wrap">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`px-4 h-9 border rounded-none text-[12px] font-medium transition-colors ${
                  selectedColor === color
                    ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                    : "border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)]"
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size selection */}
      {sizes.length > 0 && sizes[0] !== "ONE SIZE" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="eyebrow text-[var(--ink)]">
              Size
              {selectedSize && (
                <span className="ml-2 text-[var(--ink-muted)] normal-case tracking-normal font-normal">
                  · {selectedSize}
                </span>
              )}
            </p>
            <SizeGuideModal categorySlug={categorySlug} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {sizes.map((size) => {
              const hasStock = variants.some(
                (v) =>
                  v.size === size &&
                  (!selectedColor || v.color === selectedColor) &&
                  v.stock > 0
              );
              return (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  disabled={!hasStock}
                  className={`min-w-[52px] h-11 px-4 border rounded-none text-sm font-medium transition-colors ${
                    selectedSize === size
                      ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                      : hasStock
                        ? "border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)]"
                        : "opacity-30 line-through cursor-not-allowed border-[var(--line)]"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selection hint */}
      {needsSelection && (
        <p className="text-[11px] text-[var(--champagne)] uppercase tracking-[0.15em]">
          Please select options
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <button
          className={`shrink-0 w-12 h-12 border transition-colors ${
            wishlisted
              ? "border-[var(--champagne)] text-[var(--champagne)]"
              : "border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)]"
          }`}
          onClick={handleWishlist}
          disabled={isPending}
          aria-label={t("wishlistAria")}
        >
          <Heart
            className="w-5 h-5 mx-auto"
            fill={wishlisted ? "currentColor" : "none"}
            strokeWidth={1.5}
          />
        </button>
        <button
          className="flex-1 h-12 bg-[var(--ink)] text-white text-[13px] font-medium uppercase tracking-[0.15em] hover:bg-[var(--ink-muted)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          onClick={handleAddToCart}
          disabled={isPending}
        >
          <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
          Add to Bag
        </button>
        <ShareButton url={pathname} title={productName} />
      </div>

      <button
        className="w-full h-14 bg-[var(--champagne)] hover:bg-[var(--champagne-soft)] text-white text-[13px] font-medium uppercase tracking-[0.2em] transition-colors disabled:opacity-50"
        onClick={handleBuyNow}
        disabled={isPending}
      >
        Buy Now
      </button>
    </div>
  );
}
