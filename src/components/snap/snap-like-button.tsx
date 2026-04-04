"use client";

import { Heart } from "lucide-react";
import { useTransition } from "react";
import { toggleSnapLike } from "@/actions/snap";
import { cn } from "@/lib/utils";

export function SnapLikeButton({ snapId, initialLiked, likeCount }: { snapId: string; initialLiked: boolean; likeCount: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(async () => { await toggleSnapLike(snapId); })}
      disabled={isPending}
      className="flex items-center gap-1.5"
    >
      <Heart className={cn("w-5 h-5 transition-colors", initialLiked ? "fill-red-500 text-red-500" : "text-gray-600")} />
      <span className="text-sm text-gray-600">{likeCount}</span>
    </button>
  );
}
