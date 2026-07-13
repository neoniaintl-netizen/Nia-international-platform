"use client";

import { useState, useMemo, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CartItemRow } from "./cart-item-row";
import { removeSelectedFromCart } from "@/actions/cart";
import { calculateShipping } from "@/lib/shipping";
import { useTranslations } from "next-intl";
import { useKrwPerCny, formatCny } from "@/components/providers/currency-provider";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";

interface CartItemData {
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
}

export function CartClient({ items }: { items: CartItemData[] }) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(items.map((i) => i.id)));
  const [isPending, startTransition] = useTransition();
  const krwPerCny = useKrwPerCny();
  const t = useTranslations("Cart");

  const allSelected = selected.size === items.length && items.length > 0;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDeleteSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    startTransition(() => {
      removeSelectedFromCart(ids);
    });
  }

  const selectedItems = useMemo(
    () => items.filter((i) => selected.has(i.id)),
    [items, selected]
  );

  const subtotal = selectedItems.reduce((sum, item) => {
    const price = item.product.salePrice ?? item.product.originalPrice;
    return sum + price * item.quantity;
  }, 0);

  const shipping = calculateShipping(subtotal);
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-200 mb-4" />
        <p className="text-lg font-medium text-gray-500 mb-2">{t("empty")}</p>
        <p className="text-sm text-gray-400 mb-6">{t("emptyHint")}</p>
        <Link href="/">
          <Button className="bg-black hover:bg-gray-800 text-white">{t("continueShopping")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart items */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="select-all"
              checked={allSelected}
              onCheckedChange={toggleAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              {t("selectAll")} ({selected.size}/{items.length})
            </label>
          </div>
          {selected.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isPending}
              className="text-xs text-gray-400 hover:text-red-500 underline"
            >
              {t("removeSelected")}
            </button>
          )}
        </div>

        <Separator />

        {items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            checked={selected.has(item.id)}
            onToggle={toggleOne}
          />
        ))}
      </div>

      {/* Order summary */}
      <div className="lg:col-span-1">
        <div className="sticky top-36 border rounded-xl p-5 space-y-4">
          <h3 className="font-bold">{t("orderSummary")}</h3>
          <Separator />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t("itemsTotal")}</span>
              <span>{subtotal.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("shippingFee")}</span>
              <span>{shipping === 0 ? t("free") : `${shipping.toLocaleString()}원`}</span>
            </div>
            {shipping === 0 && subtotal > 0 && (
              <p className="text-xs text-green-600">{t("freeShippingNotice")}</p>
            )}
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-bold">{t("totalPayment")}</span>
            <span className="text-xl font-bold">{total.toLocaleString()}원</span>
          </div>
          {krwPerCny != null && total > 0 && (
            <div className="flex justify-between items-center text-sm -mt-1">
              <span className="text-gray-500">{t("cnyAmount")}</span>
              <span className="font-semibold text-gray-700">
                ≈ {formatCny(total / krwPerCny)}
              </span>
            </div>
          )}
          <Link
            href={`/checkout?items=${selectedItems.map((i) => i.id).join(",")}`}
          >
            <Button
              className="w-full h-12 bg-black hover:bg-gray-800 text-white font-bold text-base mt-3"
              disabled={selectedItems.length === 0}
            >
              {t("checkoutBtn")} ({selectedItems.length})
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
