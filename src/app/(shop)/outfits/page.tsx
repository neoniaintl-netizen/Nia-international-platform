import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { getOutfits } from "@/lib/queries";
import { formatPrice } from "@/lib/constants";

export const metadata = {
  title: "추천 코디 | NOVAREN",
  description: "NOVAREN 추천 코디 — 에디터가 제안하는 의상 조합",
};

/** 커버 없으면 상품 2×2 콜라주로 렌더 */
function OutfitVisual({
  cover,
  itemImages,
  title,
}: {
  cover: string | null;
  itemImages: string[];
  title: string;
}) {
  if (cover) {
    return <Image src={cover} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />;
  }
  const imgs = itemImages.slice(0, 4);
  return (
    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px bg-[var(--line)]">
      {imgs.map((url, i) => (
        <div key={i} className="relative bg-gray-100">
          <Image src={url} alt="" fill className="object-cover" />
        </div>
      ))}
      {imgs.length < 4 &&
        Array.from({ length: 4 - imgs.length }).map((_, i) => (
          <div key={`e${i}`} className="bg-gray-50" />
        ))}
    </div>
  );
}

export default async function OutfitsPage() {
  const [t, outfits] = await Promise.all([getTranslations("Shop"), getOutfits(30)]);

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      <div className="mb-8">
        <p className="eyebrow text-[var(--ink-muted)] mb-1">Outfits</p>
        <h1 className="text-2xl lg:text-3xl font-black mb-2">{t("outfits")}</h1>
        <p className="text-sm text-gray-500">{t("outfitsDesc")}</p>
      </div>

      {outfits.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-lg">{t("noOutfits")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
          {outfits.map((o) => (
            <Link key={o.id} href={`/outfits/${o.slug}`} className="group block">
              <div className="relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden mb-3">
                <OutfitVisual cover={o.coverImage} itemImages={o.itemImages} title={o.title} />
                <div className="absolute top-3 left-3 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded">
                  {t("editorPick")}
                </div>
              </div>
              <h2 className="font-bold text-sm lg:text-base group-hover:underline line-clamp-1">
                {o.title}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{t("outfitItems", { n: o.itemCount })}</p>
              <p className="text-sm font-bold mt-1">{formatPrice(o.totalPrice)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
