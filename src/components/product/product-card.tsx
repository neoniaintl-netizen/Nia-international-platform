"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { PriceDisplay } from "@/components/shared/price-display";
import { Badge } from "@/components/ui/badge";
import { toggleWishlist } from "@/actions/wishlist";
import { useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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
  reviewCount?: number;
  averageRating?: number;
  wishCount?: number;
}

interface ProductCardProps {
  product: ProductCardData;
  rank?: number;
  wishlisted?: boolean;
}

export function ProductCard({ product, rank, wishlisted = false }: ProductCardProps) {
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
      <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-2">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {/* Rank badge */}
        {rank && (
          <div className="absolute top-2 left-2 w-7 h-7 bg-black/80 text-white rounded-full flex items-center justify-center text-xs font-bold">
            {rank}
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {product.isNew && (
            <Badge className="bg-black text-white text-[10px] px-1.5">NEW</Badge>
          )}
        </div>
        {/* Wishlist button */}
        <button
          className={`absolute bottom-2 right-2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-opacity ${
            wishlisted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          } ${isPending ? "animate-pulse" : ""}`}
          onClick={handleWishlist}
          disabled={isPending}
        >
          <Heart
            className={`w-4 h-4 ${wishlisted ? "fill-red-500 text-red-500" : ""}`}
          />
        </button>
      </div>
      {/* Info */}
      <div className="space-y-1">
        <p className="text-xs font-bold text-gray-900 truncate">{product.brandName}</p>
        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{product.name}</p>
        <PriceDisplay basePrice={product.basePrice} salePrice={product.salePrice} size="sm" />
        {product.reviewCount != null && product.reviewCount > 0 && (
          <p className="text-[10px] text-gray-400">
            리뷰 {product.reviewCount.toLocaleString()}
          </p>
        )}
      </div>
    </Link>
  );
}
