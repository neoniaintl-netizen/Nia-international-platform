"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { PriceDisplay } from "@/components/shared/price-display";
import { toggleWishlist } from "@/actions/wishlist";
import { useTransition, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

function CountdownBadge({ endsAt }: { endsAt: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const target = new Date(endsAt).getTime();
    function update() {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setLabel("ENDED");
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      if (h >= 24) {
        const d = Math.floor(h / 24);
        setLabel(`${d}D LEFT`);
      } else {
        setLabel(
          `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        );
      }
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  if (!label) return null;
  return (
    <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] bg-[var(--ink)] text-white num">
      {label}
    </span>
  );
}

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  brandName: string;
  imageUrl: string;
  basePrice: number;
  salePrice?: number | null;
  isNew?: boolean;
  isFeatured?: boolean;
  isBest?: boolean;
  isSoldOut?: boolean;
  dealEndsAt?: string | null; // ISO date string
  reviewCount?: number;
  averageRating?: number;
  wishCount?: number;
}

interface ProductCardProps {
  product: ProductCardData;
  rank?: number;
  wishlisted?: boolean;
}

export function ProductCard({
  product,
  rank,
  wishlisted = false,
}: ProductCardProps) {
  const [isPending, startTransition] = useTransition();
  const { status } = useSession();
  const router = useRouter();

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    startTransition(async () => {
      await toggleWishlist(product.id);
    });
  }

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] bg-[var(--stone)] overflow-hidden mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-[600ms] ease-out"
          decoding="async"
        />
        {/* Rank badge */}
        {rank && (
          <div className="absolute top-3 left-3 text-[11px] font-medium uppercase tracking-[0.15em] text-[var(--ink)] bg-white/90 px-2 py-1 num">
            No.{String(rank).padStart(2, "0")}
          </div>
        )}
        {/* Sold out overlay */}
        {product.isSoldOut && (
          <div className="absolute inset-0 bg-[var(--ink)]/40 flex items-center justify-center">
            <span className="text-white text-[11px] font-medium uppercase tracking-[0.3em] border border-white/60 px-4 py-1.5">
              Sold Out
            </span>
          </div>
        )}
        {/* Badges (top-right) */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
          {product.isNew && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] border border-[var(--ink)] bg-white text-[var(--ink)]">
              New
            </span>
          )}
          {product.isBest && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] border border-[var(--champagne)] bg-white text-[var(--champagne)]">
              Best
            </span>
          )}
          {product.dealEndsAt && !product.isSoldOut && (
            <CountdownBadge endsAt={product.dealEndsAt} />
          )}
        </div>
        {/* Wishlist button — outlined only, no bg */}
        <button
          className={`absolute bottom-3 right-3 transition-opacity ${
            wishlisted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          } ${isPending ? "animate-pulse" : ""}`}
          onClick={handleWishlist}
          disabled={isPending}
          aria-label={wishlisted ? "위시리스트 제거" : "위시리스트 추가"}
        >
          <Heart
            className={`w-5 h-5 transition-colors drop-shadow ${
              wishlisted
                ? "fill-[var(--champagne)] text-[var(--champagne)]"
                : "text-white"
            }`}
            strokeWidth={1.5}
          />
        </button>
      </div>
      {/* Info */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[var(--ink)] truncate">
          {product.brandName}
        </p>
        <p className="text-[13px] font-normal leading-relaxed line-clamp-2 text-[var(--ink-muted)]">
          {product.name}
        </p>
        <div className="pt-1">
          <PriceDisplay
            basePrice={product.basePrice}
            salePrice={product.salePrice}
            size="sm"
          />
        </div>
        {product.reviewCount != null && product.reviewCount > 0 && (
          <p className="text-[10px] text-[var(--ink-muted)]/70 tracking-wide num pt-0.5">
            REVIEW {product.reviewCount.toLocaleString()}
          </p>
        )}
      </div>
    </Link>
  );
}
