"use client";

import { useTransition, useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toggleBrandFollow } from "@/actions/brand-follow";

interface Props {
  brandId: string;
  initialFollowing: boolean;
  initialCount?: number;
  variant?: "default" | "compact";
}

export function BrandFollowButton({
  brandId,
  initialFollowing,
  initialCount = 0,
  variant = "default",
}: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { status } = useSession();

  // session 상태가 바뀌면 initialFollowing 재반영
  useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing]);

  function handleClick() {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    startTransition(async () => {
      const result = await toggleBrandFollow(brandId);
      if ("following" in result && typeof result.following === "boolean") {
        const next = result.following;
        setFollowing(next);
        setCount((c) => c + (next ? 1 : -1));
      }
    });
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={following ? "팔로우 취소" : "브랜드 팔로우"}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
          following
            ? "bg-red-50 text-red-500"
            : "bg-white border border-gray-300 text-gray-500 hover:border-black hover:text-black"
        } ${isPending ? "animate-pulse" : ""}`}
      >
        <Heart
          className="w-4 h-4"
          fill={following ? "currentColor" : "none"}
          strokeWidth={1.5}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center gap-2 px-4 h-10 rounded-full text-xs font-bold border transition-colors ${
        following
          ? "bg-white text-black border-black"
          : "bg-black text-white border-black hover:bg-gray-900"
      } ${isPending ? "opacity-60" : ""}`}
    >
      <Heart
        className="w-3.5 h-3.5"
        fill={following ? "currentColor" : "none"}
        strokeWidth={2}
      />
      {following ? "팔로잉" : "팔로우"}
      <span className="text-[11px] opacity-70">
        {count.toLocaleString()}
      </span>
    </button>
  );
}
