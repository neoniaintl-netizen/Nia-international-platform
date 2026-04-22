import type { ProductCardData } from "@/components/product/product-card";

// DB product (with brand & images includes) → ProductCardData for UI
export function toProductCard(p: {
  id: string;
  name: string;
  slug: string;
  originalPrice: number;
  salePrice: number | null;
  isNew: boolean;
  isBest: boolean;
  status?: string;
  dealEndsAt?: Date | null;
  reviewCount: number;
  reviewAvg: number;
  rankPosition: number | null;
  brand: { name: string; slug: string };
  images: { url: string; alt: string | null }[];
}): ProductCardData {
  return {
    id: p.slug, // use slug for URL
    name: p.name,
    slug: p.slug,
    brandName: p.brand.name,
    imageUrl:
      p.images[0]?.url ??
      "https://placehold.co/400x533/c0c0c0/444?text=No+Image",
    basePrice: p.originalPrice,
    salePrice: p.salePrice,
    isNew: p.isNew,
    isBest: p.isBest,
    isFeatured: p.isBest,
    isSoldOut: p.status === "SOLDOUT",
    dealEndsAt: p.dealEndsAt ? p.dealEndsAt.toISOString() : null,
    reviewCount: p.reviewCount,
    averageRating: p.reviewAvg,
  };
}
