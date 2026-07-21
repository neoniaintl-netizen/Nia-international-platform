import { ProductCard } from "@/components/product/product-card";
import { TrendingUp, Clock, Eye, Heart } from "lucide-react";
import {
  getRankedProducts,
  getDailyRankedProducts,
  getWeeklyRankedProducts,
} from "@/lib/queries";
import { toProductCard } from "@/lib/mappers";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

const TABS = [
  { key: "realtime", labelKey: "rtRealtime", icon: Clock, descKey: "rtRealtimeDesc" },
  { key: "daily", labelKey: "rtDaily", icon: Eye, descKey: "rtDailyDesc" },
  { key: "weekly", labelKey: "rtWeekly", icon: Heart, descKey: "rtWeeklyDesc" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const t = await getTranslations("Shop");
  const activeTab: TabKey = (["realtime", "daily", "weekly"].includes(tab ?? "") ? tab : "realtime") as TabKey;

  let products;
  switch (activeTab) {
    case "daily":
      products = await getDailyRankedProducts(12);
      break;
    case "weekly":
      products = await getWeeklyRankedProducts(12);
      break;
    default:
      products = await getRankedProducts(12);
  }

  const tabInfo = TABS.find((t) => t.key === activeTab)!;
  const TabIcon = tabInfo.icon;

  const now = new Date();
  const dateLabel =
    activeTab === "weekly"
      ? `${new Date(now.getTime() - 6 * 86400000).toLocaleDateString("ko-KR")} ~ ${now.toLocaleDateString("ko-KR")}`
      : now.toLocaleDateString("ko-KR");

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5" />
        <h1 className="text-xl font-bold">{t("rankingTitle")}</h1>
      </div>

      {/* Tab navigation */}
      <div className="grid grid-cols-3 mb-6 bg-gray-100 rounded-lg p-1">
        {TABS.map((tt) => (
          <Link
            key={tt.key}
            href={`/ranking${tt.key === "realtime" ? "" : `?tab=${tt.key}`}`}
            className={cn(
              "text-xs font-medium text-center py-2.5 rounded-md transition-colors",
              activeTab === tt.key
                ? "bg-white text-black shadow-sm"
                : "text-gray-500 hover:text-black"
            )}
          >
            {t(tt.labelKey)}
          </Link>
        ))}
      </div>

      {/* Tab info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <TabIcon className="w-3.5 h-3.5" />
          <span>{t("basisSuffix", { date: dateLabel })}</span>
        </div>
        <p className="text-xs text-gray-400">{t(tabInfo.descKey)}</p>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-6">
        {products.map((product, i) => (
          <ProductCard key={product.id} product={toProductCard(product)} rank={i + 1} />
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">{t("noRanking")}</p>
          <p className="text-sm">{t("noRankingHint")}</p>
        </div>
      )}
    </div>
  );
}
