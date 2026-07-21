import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Clock } from "lucide-react";
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";

export const metadata = {
  title: "기획전 | NOVAREN",
  description: "NOVAREN 기획전 — 시즌별 엄선한 편집 기획전을 만나보세요.",
};

function formatDday(endsAt: Date | null) {
  if (!endsAt) return null;
  const now = new Date();
  const diff = endsAt.getTime() - now.getTime();
  if (diff <= 0) return "__ENDED__";
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days >= 1 ? `D-${days}` : "__TODAY__";
}

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    where: {
      isPublished: true,
      OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: 30,
  });
  const t = await getTranslations("Shop");

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
        <Link href="/" className="hover:text-black">{t("home")}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-black font-medium">{t("events")}</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-black mb-2">{t("eventsTitle")}</h1>
        <p className="text-sm text-gray-500">
          {t("eventsDesc")}
        </p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">{t("noEvents")}</p>
          <p className="text-sm">{t("noEventsHint")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => {
            const dday = formatDday(event.endsAt);
            return (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="group block"
              >
                <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden mb-3">
                  <Image
                    src={event.coverImage}
                    alt={event.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {dday && (
                    <div className="absolute top-3 left-3 bg-black/80 text-white text-[11px] font-bold px-2 py-1 rounded flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {dday === "__ENDED__" ? t("dEnded") : dday === "__TODAY__" ? t("dToday") : dday}
                    </div>
                  )}
                </div>
                <h2 className="font-bold text-base lg:text-lg group-hover:underline">
                  {event.title}
                </h2>
                {event.subtitle && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {event.subtitle}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
