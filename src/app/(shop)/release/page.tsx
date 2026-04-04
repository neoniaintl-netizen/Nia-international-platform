import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { getUpcomingReleases, getReleasedItems } from "@/lib/queries";
import { NotifyButton } from "@/components/release/notify-button";

export default async function ReleasePage() {
  const [upcoming, released] = await Promise.all([
    getUpcomingReleases(6),
    getReleasedItems(4),
  ]);

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5" />
        <h1 className="text-xl font-bold">발매 캘린더</h1>
      </div>

      {/* Upcoming */}
      <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full" />
        발매 예정
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
                  <p className="text-xs text-gray-400">발매일</p>
                  <p className="text-sm font-bold">
                    {item.releaseDate.toLocaleDateString("ko-KR")}
                  </p>
                </div>
                {item.price && (
                  <p className="text-sm font-bold">{item.price.toLocaleString()}원</p>
                )}
              </div>
              <NotifyButton releaseId={item.id} initialCount={item.notifyCount} />
            </div>
          </div>
        ))}
      </div>

      {/* Released */}
      {released.length > 0 && (
        <>
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-400 rounded-full" />
            발매 완료
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {released.map((item) => (
              <div key={item.id} className="border rounded-xl overflow-hidden opacity-60">
                <div className="aspect-square bg-gray-100 relative">
                  <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
                  <Badge className="absolute top-3 left-3 bg-gray-500 text-white">발매 완료</Badge>
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
