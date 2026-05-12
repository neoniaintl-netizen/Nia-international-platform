import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Clock } from "lucide-react";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "기획전 | NOVAREN",
  description: "NOVAREN 기획전 — 시즌별 엄선한 편집 기획전을 만나보세요.",
};

function formatDday(endsAt: Date | null) {
  if (!endsAt) return null;
  const now = new Date();
  const diff = endsAt.getTime() - now.getTime();
  if (diff <= 0) return "종료";
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days >= 1 ? `D-${days}` : "오늘 마감";
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

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
        <Link href="/" className="hover:text-black">홈</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-black font-medium">기획전</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-black mb-2">기획전</h1>
        <p className="text-sm text-gray-500">
          시즌별로 엄선한 편집 기획전을 만나보세요
        </p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">진행 중인 기획전이 없습니다</p>
          <p className="text-sm">곧 새로운 기획전이 오픈됩니다.</p>
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
                      {dday}
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
