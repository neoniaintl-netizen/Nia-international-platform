import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";

export const metadata = {
  title: "룩북 | NOVAREN",
  description:
    "NOVAREN 룩북 — 에디터가 엄선한 시즌별 코디네이션과 스타일링 제안",
};

const GENDER_TABS = [
  { labelKey: "genderAll", value: "" },
  { labelKey: "genderMen", value: "MEN" },
  { labelKey: "genderWomen", value: "WOMEN" },
  { labelKey: "genderUnisex", value: "UNISEX" },
];

export default async function LookbookIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ g?: string }>;
}) {
  const { g } = await searchParams;
  const gender = g && ["MEN", "WOMEN", "UNISEX"].includes(g) ? g : "";

  const lookbooks = await prisma.lookbook.findMany({
    where: {
      isPublished: true,
      ...(gender ? { gender } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: 30,
  });
  const t = await getTranslations("Shop");

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
        <Link href="/" className="hover:text-black">{t("home")}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-black font-medium">{t("lookbook")}</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-black mb-2">{t("lookbookTitle")}</h1>
        <p className="text-sm text-gray-500">
          {t("lookbookDesc")}
        </p>
      </div>

      {/* Gender tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {GENDER_TABS.map((gt) => (
          <Link
            key={gt.value}
            href={gt.value ? `/lookbook?g=${gt.value}` : "/lookbook"}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border ${
              gender === gt.value
                ? "bg-black text-white border-black"
                : "border-gray-300 text-gray-500 hover:border-black hover:text-black"
            }`}
          >
            {t(gt.labelKey)}
          </Link>
        ))}
      </div>

      {lookbooks.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">{t("noLookbookP")}</p>
          <p className="text-sm">{t("noLookbookHint")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
          {lookbooks.map((lb) => (
            <Link
              key={lb.id}
              href={`/lookbook/${lb.slug}`}
              className="group block"
            >
              <div className="relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden mb-3">
                <Image
                  src={lb.coverImage}
                  alt={lb.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {lb.season && (
                  <div className="absolute top-3 left-3 bg-white/90 text-black text-[10px] font-bold px-2 py-1 rounded">
                    {lb.season}
                  </div>
                )}
              </div>
              <h2 className="font-bold text-sm lg:text-base group-hover:underline line-clamp-2">
                {lb.title}
              </h2>
              {lb.subtitle && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                  {lb.subtitle}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
