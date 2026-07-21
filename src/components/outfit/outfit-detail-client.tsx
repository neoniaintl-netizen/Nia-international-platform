"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ShoppingBag, Loader2 } from "lucide-react";
import { addToCart } from "@/actions/cart";
import { formatPrice } from "@/lib/constants";
import { useKrwPerCny, formatCny } from "@/components/providers/currency-provider";

export type OutfitItemData = {
  lookbookProductId: string;
  role: string | null;
  productId: string;
  slug: string;
  name: string;
  brandName: string;
  imageUrl: string | null;
  originalPrice: number;
  salePrice: number | null;
  isSoldOut: boolean;
  sizes: { size: string; variantId: string }[];
};

const ROLE_ORDER = ["OUTER", "TOP", "BOTTOM", "SHOES", "ACC"];

export function OutfitDetailClient({
  title,
  subtitle,
  description,
  coverImage,
  items,
}: {
  title: string;
  subtitle: string | null;
  description: string | null;
  coverImage: string | null;
  items: OutfitItemData[];
}) {
  const t = useTranslations("Shop");
  const router = useRouter();
  const { status } = useSession();
  const krwPerCny = useKrwPerCny();
  const [isPending, startTransition] = useTransition();

  // 선택 상태: lookbookProductId → { checked, variantId }
  const [selection, setSelection] = useState<Record<string, { checked: boolean; variantId: string | null }>>(
    () =>
      Object.fromEntries(
        items.map((i) => [
          i.lookbookProductId,
          {
            checked: !i.isSoldOut,
            // 단일 사이즈(FREE 등)면 자동 선택
            variantId: i.sizes.length === 1 ? i.sizes[0].variantId : null,
          },
        ])
      )
  );

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          ROLE_ORDER.indexOf(a.role ?? "ACC") - ROLE_ORDER.indexOf(b.role ?? "ACC")
      ),
    [items]
  );

  const selectedItems = sorted.filter(
    (i) => selection[i.lookbookProductId]?.checked && !i.isSoldOut
  );
  const total = selectedItems.reduce(
    (s, i) => s + (i.salePrice ?? i.originalPrice),
    0
  );

  function roleLabel(role: string | null) {
    if (!role) return "";
    const map: Record<string, string> = {
      TOP: t("roleTOP"), BOTTOM: t("roleBOTTOM"), OUTER: t("roleOUTER"),
      SHOES: t("roleSHOES"), ACC: t("roleACC"),
    };
    return map[role] ?? "";
  }

  function handleAddAll() {
    if (status !== "authenticated") {
      router.push("/login?callbackUrl=" + encodeURIComponent(window.location.pathname));
      return;
    }
    // 사이즈 미선택 검증
    const missing = selectedItems.filter((i) => !selection[i.lookbookProductId]?.variantId);
    if (missing.length > 0) {
      toast.error(t("selectAllSizes"));
      return;
    }
    if (selectedItems.length === 0) return;

    startTransition(async () => {
      let ok = 0;
      for (const i of selectedItems) {
        const variantId = selection[i.lookbookProductId]!.variantId!;
        const res = await addToCart(i.productId, variantId, 1);
        if (!res?.error) ok += 1;
      }
      if (ok > 0) {
        toast.success(t("outfitAdded", { n: ok }), {
          action: { label: t("addAllToCart"), onClick: () => router.push("/cart") },
        });
      } else {
        toast.error("장바구니 담기에 실패했습니다.");
      }
    });
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
        {/* 비주얼 */}
        <div className="relative aspect-[3/4] lg:aspect-[4/5] bg-gray-100 rounded-xl overflow-hidden lg:sticky lg:top-24 self-start">
          {coverImage ? (
            <Image src={coverImage} alt={title} fill className="object-cover" priority />
          ) : (
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px bg-[var(--line)]">
              {items.slice(0, 4).map((i) => (
                <div key={i.lookbookProductId} className="relative bg-gray-100">
                  {i.imageUrl && <Image src={i.imageUrl} alt="" fill className="object-cover" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 정보 + 아이템 */}
        <div>
          <p className="eyebrow text-[var(--ink-muted)] mb-2">{t("editorPick")}</p>
          <h1 className="text-2xl lg:text-3xl font-black">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
          {description && (
            <p className="text-sm text-gray-600 leading-relaxed mt-4 whitespace-pre-wrap">
              {description}
            </p>
          )}

          <div className="h-px bg-[var(--line)] my-6" />

          {/* 아이템 리스트 */}
          <div className="space-y-4">
            {sorted.map((item) => {
              const sel = selection[item.lookbookProductId];
              const price = item.salePrice ?? item.originalPrice;
              return (
                <div
                  key={item.lookbookProductId}
                  className={`flex gap-3 ${item.isSoldOut ? "opacity-50" : ""}`}
                >
                  {!item.isSoldOut && (
                    <input
                      type="checkbox"
                      checked={sel?.checked ?? false}
                      onChange={(e) =>
                        setSelection((s) => ({
                          ...s,
                          [item.lookbookProductId]: { ...s[item.lookbookProductId], checked: e.target.checked },
                        }))
                      }
                      className="mt-1 w-4 h-4 shrink-0 accent-black"
                    />
                  )}
                  <Link href={`/products/${item.slug}`} className="relative w-16 h-20 shrink-0 bg-gray-100 rounded overflow-hidden">
                    {item.imageUrl && <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {item.role && (
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                          {roleLabel(item.role)}
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400 truncate">{item.brandName}</span>
                    </div>
                    <Link href={`/products/${item.slug}`} className="block text-sm hover:underline line-clamp-1 mt-0.5">
                      {item.name}
                    </Link>
                    <p className="text-sm font-bold mt-0.5">
                      {formatPrice(price)}
                      {item.isSoldOut && <span className="ml-2 text-red-500 text-xs">{t("soldOut")}</span>}
                    </p>
                    {/* 사이즈 선택 */}
                    {!item.isSoldOut && item.sizes.length > 1 && (
                      <select
                        value={sel?.variantId ?? ""}
                        onChange={(e) =>
                          setSelection((s) => ({
                            ...s,
                            [item.lookbookProductId]: { ...s[item.lookbookProductId], variantId: e.target.value || null },
                          }))
                        }
                        className={`mt-2 text-xs border rounded px-2 py-1 bg-white ${
                          sel?.checked && !sel?.variantId ? "border-red-400" : "border-gray-300"
                        }`}
                      >
                        <option value="">{t("selectSize")}</option>
                        {item.sizes.map((sz) => (
                          <option key={sz.variantId} value={sz.variantId}>
                            {sz.size === "FREE" ? t("oneSize") : sz.size}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="h-px bg-[var(--line)] my-6" />

          {/* 합계 + 담기 */}
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-sm text-gray-500">{t("outfitTotal")}</span>
            <div className="text-right">
              <span className="text-xl font-bold">{formatPrice(total)}</span>
              {krwPerCny && (
                <span className="text-xs text-gray-400 ml-2">≈ {formatCny(total / krwPerCny)}</span>
              )}
            </div>
          </div>
          <button
            onClick={handleAddAll}
            disabled={isPending || selectedItems.length === 0}
            className="w-full h-13 py-4 bg-black hover:bg-gray-800 text-white font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}
            {t("addAllToCart")} ({selectedItems.length})
          </button>
        </div>
      </div>
    </div>
  );
}
