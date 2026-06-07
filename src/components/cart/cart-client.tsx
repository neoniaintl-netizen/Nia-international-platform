"use client";

import { useState, useMemo, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CartItemRow } from "./cart-item-row";
import { removeSelectedFromCart } from "@/actions/cart";
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

  const shipping = subtotal >= 30000 ? 0 : subtotal > 0 ? 3000 : 0;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-200 mb-4" />
        <p className="text-lg font-medium text-gray-500 mb-2">장바구니가 비어있습니다</p>
        <p className="text-sm text-gray-400 mb-6">마음에 드는 상품을 담아보세요!</p>
        <Link href="/">
          <Button className="bg-black hover:bg-gray-800 text-white">쇼핑 계속하기</Button>
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
              전체 선택 ({selected.size}/{items.length})
            </label>
          </div>
          {selected.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isPending}
              className="text-xs text-gray-400 hover:text-red-500 underline"
            >
              선택 삭제
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
          <h3 className="font-bold">주문 요약</h3>
          <Separator />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">상품 금액</span>
              <span>{subtotal.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">배송비</span>
              <span>{shipping === 0 ? "무료" : `${shipping.toLocaleString()}원`}</span>
            </div>
            {shipping === 0 && subtotal > 0 && (
              <p className="text-xs text-green-600">3만원 이상 무료배송 적용</p>
            )}
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-bold">총 결제 금액</span>
            <span className="text-xl font-bold">{total.toLocaleString()}원</span>
          </div>
          <Link
            href={`/checkout?items=${selectedItems.map((i) => i.id).join(",")}`}
          >
            <Button
              className="w-full h-12 bg-black hover:bg-gray-800 text-white font-bold text-base mt-3"
              disabled={selectedItems.length === 0}
            >
              주문하기 ({selectedItems.length})
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
