"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  searchProductsForOutfitAction,
  addOutfitItemAction,
  removeOutfitItemAction,
  updateOutfitItemRoleAction,
} from "@/actions/outfit";

const ROLE_OPTIONS = [
  { value: "TOP", label: "상의" },
  { value: "OUTER", label: "아우터" },
  { value: "BOTTOM", label: "하의" },
  { value: "SHOES", label: "신발" },
  { value: "ACC", label: "악세서리" },
];

// 카테고리 slug → 기본 역할 추천
function guessRole(categorySlug: string): string {
  if (/outer/.test(categorySlug)) return "OUTER";
  if (/top/.test(categorySlug)) return "TOP";
  if (/bottom|skirt|pants/.test(categorySlug)) return "BOTTOM";
  if (/shoes/.test(categorySlug)) return "SHOES";
  return "ACC";
}

type SearchResult = {
  id: string;
  name: string;
  brandName: string;
  price: number;
  imageUrl: string | null;
  categorySlug: string;
};

type Item = {
  id: string; // lookbookProduct id
  role: string | null;
  product: {
    id: string;
    name: string;
    status: string;
    originalPrice: number;
    salePrice: number | null;
    brand: { name: string };
    images: { url: string }[];
  };
};

export function OutfitItemManager({
  outfitId,
  items,
}: {
  outfitId: string;
  items: Item[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const addedIds = new Set(items.map((i) => i.product.id));

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await searchProductsForOutfitAction(query);
      setResults(res.products);
      if (res.products.length === 0) toast.info("검색 결과가 없습니다.");
    } finally {
      setSearching(false);
    }
  }

  function handleAdd(p: SearchResult) {
    startTransition(async () => {
      const res = await addOutfitItemAction(outfitId, p.id, guessRole(p.categorySlug));
      if (res.error) toast.error(res.error);
      else toast.success(`추가됨: ${p.name}`);
    });
  }

  function handleRemove(itemId: string) {
    startTransition(async () => {
      await removeOutfitItemAction(itemId);
      toast.success("제거되었습니다.");
    });
  }

  function handleRoleChange(itemId: string, role: string) {
    startTransition(async () => {
      await updateOutfitItemRoleAction(itemId, role);
    });
  }

  const total = items.reduce(
    (s, i) => s + (i.product.salePrice ?? i.product.originalPrice),
    0
  );

  return (
    <div className="space-y-6">
      {/* ── 담긴 아이템 ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">코디 아이템 ({items.length})</h3>
          <span className="text-sm text-gray-500">
            합계 {total.toLocaleString()}원
          </span>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 border rounded-lg py-8 text-center">
            아래에서 상품을 검색해 아이템을 추가하세요.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const p = item.product;
              const price = p.salePrice ?? p.originalPrice;
              return (
                <div key={item.id} className="flex items-center gap-3 border rounded-lg p-2.5">
                  <div className="relative w-12 h-14 shrink-0 bg-gray-100 rounded overflow-hidden">
                    {p.images[0]?.url && (
                      <Image src={p.images[0].url} alt={p.name} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-400">{p.brand.name}</p>
                    <p className="text-sm truncate">{p.name}</p>
                    <p className="text-xs font-bold">
                      {price.toLocaleString()}원
                      {p.status === "SOLDOUT" && (
                        <span className="ml-2 text-red-500">품절</span>
                      )}
                    </p>
                  </div>
                  <select
                    value={item.role ?? ""}
                    onChange={(e) => handleRoleChange(item.id, e.target.value)}
                    disabled={isPending}
                    className="text-xs border rounded px-2 py-1 bg-white shrink-0"
                  >
                    <option value="">역할</option>
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={isPending}
                    className="text-gray-300 hover:text-red-500 shrink-0 p-1"
                    aria-label="제거"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 상품 검색 → 추가 ── */}
      <div className="border-t pt-5">
        <h3 className="font-bold text-sm mb-3">상품 검색해서 추가</h3>
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="상품명·브랜드·slug 검색"
              className="pl-9"
            />
          </div>
          <Button type="submit" disabled={searching}>
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "검색"}
          </Button>
        </form>

        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {results.map((p) => {
              const already = addedIds.has(p.id);
              return (
                <div key={p.id} className="flex items-center gap-3 border rounded-lg p-2.5">
                  <div className="relative w-12 h-14 shrink-0 bg-gray-100 rounded overflow-hidden">
                    {p.imageUrl && (
                      <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-400">{p.brandName}</p>
                    <p className="text-sm truncate">{p.name}</p>
                    <p className="text-xs font-bold">{p.price.toLocaleString()}원</p>
                  </div>
                  <Button
                    size="sm"
                    variant={already ? "outline" : "default"}
                    disabled={already || isPending}
                    onClick={() => handleAdd(p)}
                    className="shrink-0"
                  >
                    {already ? "추가됨" : <><Plus className="w-3 h-3 mr-1" /> 추가</>}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
