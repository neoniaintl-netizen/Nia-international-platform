import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { getSnaps } from "@/lib/queries";

export default async function SnapPage() {
  const snaps = await getSnaps(12);

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-xl font-bold mb-6">스냅</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {snaps.map((snap) => (
          <Link key={snap.id} href={`/snap/${snap.id}`} className="group">
            <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-gray-100">
              <Image
                src={snap.imageUrl}
                alt={snap.caption ?? "스냅"}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-white text-xs font-medium">@{snap.authorName}</p>
                {snap.caption && (
                  <p className="text-white/70 text-[10px] mt-0.5">{snap.caption}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-white/70 text-[10px]">
                    <Heart className="w-3 h-3" /> {snap.likeCount}
                  </span>
                  <span className="flex items-center gap-1 text-white/70 text-[10px]">
                    <MessageCircle className="w-3 h-3" /> {snap.commentCount}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
