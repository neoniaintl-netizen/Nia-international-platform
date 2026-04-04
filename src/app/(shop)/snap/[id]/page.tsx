import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  MessageCircle,
  ChevronRight,
  ArrowLeft,
  Share2,
  User,
} from "lucide-react";
import { getSnaps } from "@/lib/queries";

export default async function SnapDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const snap = await prisma.snap.findUnique({ where: { id } });

  if (!snap || !snap.isActive) return notFound();

  // 좋아요 수 증가 (조회 추적용, fire & forget)
  // 실제로는 likeCount가 아닌 viewCount가 적절하지만 모델에 없으므로 skip

  // 다른 스냅 추천 (본인 제외)
  const otherSnaps = await getSnaps(9);
  const moreSnaps = otherSnaps.filter((s) => s.id !== snap.id).slice(0, 8);

  const createdDate = new Date(snap.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-6">
        <Link href="/" className="hover:text-black">
          홈
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/snap" className="hover:text-black">
          스냅
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-black font-medium">@{snap.authorName}</span>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto">
        {/* Author header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 shrink-0">
            {snap.authorImage ? (
              <Image
                src={snap.authorImage}
                alt={snap.authorName}
                width={44}
                height={44}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <p className="font-bold text-sm">@{snap.authorName}</p>
            <p className="text-xs text-gray-400">{createdDate}</p>
          </div>
        </div>

        {/* Image */}
        <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-gray-100 mb-5">
          <Image
            src={snap.imageUrl}
            alt={snap.caption ?? "스냅"}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-5">
            <button className="flex items-center gap-1.5 text-gray-600 hover:text-red-500 transition-colors">
              <Heart className="w-5 h-5" />
              <span className="text-sm font-medium">
                {snap.likeCount.toLocaleString()}
              </span>
            </button>
            <span className="flex items-center gap-1.5 text-gray-600">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">
                {snap.commentCount.toLocaleString()}
              </span>
            </span>
          </div>
          <button className="text-gray-400 hover:text-black transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Caption */}
        {snap.caption && (
          <div className="mb-6">
            <p className="text-sm leading-relaxed">
              <span className="font-bold mr-1.5">@{snap.authorName}</span>
              {snap.caption}
            </p>
          </div>
        )}

        {/* Back button */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/snap"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            목록으로
          </Link>
        </div>

        <Separator className="mb-8" />

        {/* More snaps */}
        {moreSnaps.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-5">더 많은 스냅</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {moreSnaps.map((s) => (
                <Link
                  key={s.id}
                  href={`/snap/${s.id}`}
                  className="group"
                >
                  <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src={s.imageUrl}
                      alt={s.caption ?? "스냅"}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                      <p className="text-white text-[10px] font-medium">
                        @{s.authorName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-0.5 text-white/70 text-[10px]">
                          <Heart className="w-2.5 h-2.5" /> {s.likeCount}
                        </span>
                        <span className="flex items-center gap-0.5 text-white/70 text-[10px]">
                          <MessageCircle className="w-2.5 h-2.5" />{" "}
                          {s.commentCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
