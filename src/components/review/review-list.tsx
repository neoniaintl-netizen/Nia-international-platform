"use client";

import { Star, ThumbsUp, Trash2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteReview, toggleHelpful } from "@/actions/review";
import { useTransition } from "react";
import { toast } from "sonner";
import Image from "next/image";

type ReviewItem = {
  id: string;
  rating: number;
  content: string;
  imageUrls: string[];
  isVerified: boolean;
  helpfulCount: number;
  createdAt: string; // serialized
  user: { id: string; nickname: string | null; name: string | null };
};

export function ReviewList({
  reviews,
  total,
  productId,
  currentUserId,
}: {
  reviews: ReviewItem[];
  total: number;
  productId: string;
  currentUserId?: string;
}) {
  if (total === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        <p>아직 리뷰가 없습니다.</p>
        <p className="mt-1">첫 리뷰를 작성해보세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <p className="text-sm text-gray-500 mb-4">총 {total}개의 리뷰</p>
      {reviews.map((review) => (
        <ReviewRow
          key={review.id}
          review={review}
          productId={productId}
          isOwner={currentUserId === review.user.id}
        />
      ))}
    </div>
  );
}

function ReviewRow({
  review,
  productId,
  isOwner,
}: {
  review: ReviewItem;
  productId: string;
  isOwner: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const displayName = review.user.nickname || review.user.name || "익명";
  const maskedName =
    displayName.length > 1
      ? displayName[0] + "*".repeat(displayName.length - 1)
      : displayName;
  const date = new Date(review.createdAt).toLocaleDateString("ko-KR");

  function handleDelete() {
    if (!confirm("리뷰를 삭제하시겠습니까?")) return;
    startTransition(async () => {
      const result = await deleteReview(review.id, productId);
      if (result.success) toast.success("리뷰가 삭제되었습니다.");
      else toast.error(result.error);
    });
  }

  function handleHelpful() {
    startTransition(async () => {
      await toggleHelpful(review.id);
    });
  }

  return (
    <div className="border-b py-5 last:border-0">
      {/* Header: stars + date */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-3.5 h-3.5 ${
                  s <= review.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-200"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">{maskedName}</span>
          {review.isVerified && (
            <Badge variant="outline" className="text-[10px] gap-0.5 text-green-600 border-green-200">
              <ShieldCheck className="w-3 h-3" /> 구매인증
            </Badge>
          )}
        </div>
        <span className="text-xs text-gray-400">{date}</span>
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed">{review.content}</p>

      {/* Review images */}
      {review.imageUrls?.length > 0 && (
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {review.imageUrls.map((url, i) => (
            <div key={url} className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border">
              <Image
                src={url}
                alt={`리뷰 이미지 ${i + 1}`}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleHelpful}
          disabled={isPending}
          className="text-xs text-gray-400 hover:text-gray-600 gap-1 h-7 px-2"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          도움이 돼요 {review.helpfulCount > 0 && `(${review.helpfulCount})`}
        </Button>
        {isOwner && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs text-red-400 hover:text-red-600 gap-1 h-7 px-2"
          >
            <Trash2 className="w-3.5 h-3.5" /> 삭제
          </Button>
        )}
      </div>
    </div>
  );
}
