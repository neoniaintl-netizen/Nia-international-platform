import { notFound } from "next/navigation";
import { getOutfitBySlug } from "@/lib/queries";
import { OutfitDetailClient, type OutfitItemData } from "@/components/outfit/outfit-detail-client";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const o = await getOutfitBySlug(slug);
  return {
    title: o ? `${o.title} | NOVAREN 추천 코디` : "추천 코디 | NOVAREN",
    description: o?.subtitle ?? "NOVAREN 추천 코디",
  };
}

export default async function OutfitDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const outfit = await getOutfitBySlug(slug);
  if (!outfit) notFound();

  const items: OutfitItemData[] = outfit.products.map((lp) => {
    const p = lp.product;
    // 사이즈 옵션(중복 제거) — 재고>0만
    const sizes = [
      ...new Map(
        p.variants
          .filter((v) => v.stock > 0)
          .map((v) => [v.size ?? "FREE", { size: v.size ?? "FREE", variantId: v.id }])
      ).values(),
    ];
    return {
      lookbookProductId: lp.id,
      role: lp.role,
      productId: p.id,
      slug: p.slug,
      name: p.name,
      brandName: p.brand.nameKo ?? p.brand.name,
      imageUrl: p.images[0]?.url ?? null,
      originalPrice: p.originalPrice,
      salePrice: p.salePrice,
      isSoldOut: p.status === "SOLDOUT" || sizes.length === 0,
      sizes,
    };
  });

  return (
    <OutfitDetailClient
      title={outfit.title}
      subtitle={outfit.subtitle}
      description={outfit.description}
      coverImage={outfit.coverImage || null}
      items={items}
    />
  );
}
