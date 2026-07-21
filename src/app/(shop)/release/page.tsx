import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { getUpcomingReleases, getReleasedItems } from "@/lib/queries";
import { NotifyButton } from "@/components/release/notify-button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";

export default async function ReleasePage() {
  const [upcoming, released, session] = await Promise.all([
    getUpcomingReleases(6),
    getReleasedItems(4),
    auth(),
  ]);

  // Get user's subscriptions
  let subscribedIds = new Set<string>();
  if (session?.user?.id) {
    const subs = await prisma.releaseSubscription.findMany({
      where: { userId: session.user.id },
      select: { releaseId: true },
    });
    subscribedIds = new Set(subs.map((s) => s.releaseId));
  }
  const t = await getTranslations("Shop");

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5" />
        <h1 className="text-xl font-bold">{t("releaseTitle")}</h1>
      </div>

      {/* Upcoming */}
      <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full" />
        {t("releaseUpcoming")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {upcoming.map((item) => (
          <div key={item.id} className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-square bg-gray-100 relative">
              <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-400">{item.brandName}</p>
              <p className="text-sm font-medium mt-1 line-clamp-2">{item.productName}</p>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="text-xs text-gray-400">{t("releaseDate")}</p>
                  <p className="text-sm font-bold">
                    {item.releaseDate.toLocaleDateString("ko-KR")}
                  </p>
                </div>
                {item.price && (
                  <p className="text-sm font-bold">{item.price.toLocaleString()}원</p>
                )}
              </div>
              <NotifyButton releaseId={item.id} initialCount={item.notifyCount} initialSubscribed={subscribedIds.has(item.id)} />
            </div>
          </div>
        ))}
      </div>

      {/* Released */}
      {released.length > 0 && (
        <>
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-400 rounded-full" />
            {t("releaseDone")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {released.map((item) => (
              <div key={item.id} className="border rounded-xl overflow-hidden opacity-60">
                <div className="aspect-square bg-gray-100 relative">
                  <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
                  <Badge className="absolute top-3 left-3 bg-gray-500 text-white">{t("releaseDone")}</Badge>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-400">{item.brandName}</p>
                  <p className="text-sm font-medium mt-1 line-clamp-2">{item.productName}</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-sm text-gray-400">
                      {item.releaseDate.toLocaleDateString("ko-KR")}
                    </p>
                    {item.price && (
                      <p className="text-sm font-bold">{item.price.toLocaleString()}원</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
