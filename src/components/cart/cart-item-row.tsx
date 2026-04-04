"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { PriceDisplay } from "@/components/shared/price-display";
import { updateCartQuantity, removeFromCart } from "@/actions/cart";
import { useTransition } from "react";

interface CartItemRowProps {
  item: {
    id: string;
    quantity: number;
    product: {
      name: string;
      originalPrice: number;
      salePrice: number | null;
      slug: string;
      brand: { name: string };
      images: { url: string }[];
    };
    variant: {
      color: string | null;
      size: string | null;
      sku: string | null;
    } | null;
  };
  checked: boolean;
  onToggle: (id: string) => void;
}

export function CartItemRow({ item, checked, onToggle }: CartItemRowProps) {
  const [isPending, startTransition] = useTransition();
  const price = item.product.salePrice ?? item.product.originalPrice;
  const imageUrl = item.product.images[0]?.url ?? "https://placehold.co/200x267/c0c0c0/444?text=No+Image";

  function handleQuantity(newQty: number) {
    if (newQty < 1) return;
    startTransition(() => {
      updateCartQuantity(item.id, newQty);
    });
  }

  function handleRemove() {
    startTransition(() => {
      removeFromCart(item.id);
    });
  }

  return (
    <div className={`flex gap-4 py-4 border-b transition-opacity ${isPending ? "opacity-50" : ""}`}>
      <Checkbox
        checked={checked}
        onCheckedChange={() => onToggle(item.id)}
        className="mt-1 shrink-0"
      />
      <div className="w-20 h-[106px] bg-gray-100 rounded-lg overflow-hidden shrink-0">
        <Image
          src={imageUrl}
          alt={item.product.name}
          width={80}
          height={106}
          className="object-cover w-full h-full"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold">{item.product.brand.name}</p>
        <p className="text-sm truncate mt-0.5">{item.product.name}</p>
        <p className="text-xs text-gray-400 mt-1">
          {[item.variant?.color, item.variant?.size].filter(Boolean).join(" / ") || "ONE SIZE"}
        </p>
        <div className="mt-3">
          <PriceDisplay
            basePrice={item.product.originalPrice}
            salePrice={item.product.salePrice}
            size="sm"
          />
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center border rounded-lg">
            <button
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30"
              onClick={() => handleQuantity(item.quantity - 1)}
              disabled={isPending || item.quantity <= 1}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 h-8 flex items-center justify-center text-sm font-medium">
              {item.quantity}
            </span>
            <button
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30"
              onClick={() => handleQuantity(item.quantity + 1)}
              disabled={isPending}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            className="p-1.5 text-gray-400 hover:text-gray-600"
            onClick={handleRemove}
            disabled={isPending}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm font-bold mt-2 text-right">
          {(price * item.quantity).toLocaleString()}원
        </p>
      </div>
    </div>
  );
}
