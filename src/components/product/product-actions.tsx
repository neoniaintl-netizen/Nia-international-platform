"use client";

import { useState, useTransition } from "react";
import { Heart, ShoppingBag, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/actions/cart";
import { toggleWishlist } from "@/actions/wishlist";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
}

export function ProductActions({
  productId,
  productName,
  variants,
  colors,
  sizes,
  isWishlisted,
}: ProductActionsProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(
    colors.length === 1 ? colors[0] : null
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.length === 1 || (sizes.length === 1 && sizes[0] === "ONE SIZE") ? sizes[0] : null
  );
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [isPending, startTransition] = useTransition();
  const { status } = useSession();
  const router = useRouter();

  // Find matching variant based on selection
  function findVariant() {
    return variants.find((v) => {
      const colorMatch = !selectedColor || v.color === selectedColor;
      const sizeMatch = !selectedSize || v.size === selectedSize;
      return colorMatch && sizeMatch;
    });
  }

  function handleAddToCart() {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }

    const variant = findVariant();
    if (!variant) {
      toast.error("옵션을 선택해주세요");
      return;
    }

    if (variant.stock <= 0) {
      toast.error("품절된 상품입니다");
      return;
    }

    startTransition(async () => {
      await addToCart(productId, variant.id);
      toast.success("장바구니에 추가되었습니다", {
        action: {
          label: "장바구니 보기",
          onClick: () => router.push("/cart"),
        },
      });
    });
  }

  function handleBuyNow() {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }

    const variant = findVariant();
    if (!variant) {
      toast.error("옵션을 선택해주세요");
      return;
    }

    startTransition(async () => {
      await addToCart(productId, variant.id);
      router.push("/checkout");
    });
  }

  function handleWishlist() {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }

    startTransition(async () => {
      const result = await toggleWishlist(productId);
      setWishlisted(result.wishlisted);
      toast(result.wishlisted ? "좋아요에 추가되었습니다" : "좋아요에서 삭제되었습니다");
    });
  }

  const needsSelection =
    (colors.length > 1 && !selectedColor) || (sizes.length > 1 && !selectedSize);

  return (
    <div className="space-y-6">
      {/* Color selection */}
      {colors.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-3">
            컬러 {selectedColor && <span className="text-gray-400 font-normal">· {selectedColor}</span>}
          </p>
          <div className="flex gap-2 flex-wrap">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`px-3 h-8 border rounded-full text-xs font-medium transition-colors ${
                  selectedColor === color
                    ? "border-black bg-black text-white"
                    : "hover:border-black hover:bg-gray-50"
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
            <p className="text-sm font-medium">
              사이즈 {selectedSize && <span className="text-gray-400 font-normal">· {selectedSize}</span>}
            </p>
            <button className="text-xs text-gray-400 underline">사이즈 가이드</button>
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
                  className={`min-w-[48px] h-10 px-4 border rounded-lg text-sm font-medium transition-colors ${
                    selectedSize === size
                      ? "border-black bg-black text-white"
                      : hasStock
                        ? "hover:border-black hover:bg-gray-50"
                        : "opacity-30 line-through cursor-not-allowed"
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
        <p className="text-xs text-orange-500">옵션을 선택해주세요</p>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="icon"
          className={`shrink-0 w-12 h-12 ${wishlisted ? "text-red-500 border-red-200 bg-red-50 hover:bg-red-100" : ""}`}
          onClick={handleWishlist}
          disabled={isPending}
        >
          <Heart className={`w-5 h-5 ${wishlisted ? "fill-red-500" : ""}`} />
        </Button>
        <Button
          className="flex-1 h-12 bg-black hover:bg-gray-800 text-white font-bold text-base gap-2"
          onClick={handleAddToCart}
          disabled={isPending}
        >
          <ShoppingBag className="w-5 h-5" />
          장바구니
        </Button>
        <Button variant="outline" size="icon" className="shrink-0 w-12 h-12">
          <Share2 className="w-5 h-5" />
        </Button>
      </div>

      <Button
        className="w-full h-14 bg-[var(--sale)] hover:bg-red-600 text-white font-bold text-lg"
        onClick={handleBuyNow}
        disabled={isPending}
      >
        바로 구매
      </Button>
    </div>
  );
}
