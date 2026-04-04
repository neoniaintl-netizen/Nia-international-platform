"use client";

import { useTransition } from "react";
import { deleteBanner, toggleBannerActive } from "@/actions/admin";
import { toast } from "sonner";

export function BannerActions({
  bannerId,
  isActive,
}: {
  bannerId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleBannerActive(bannerId, !isActive);
      toast.success(isActive ? "배너가 비활성화되었습니다." : "배너가 활성화되었습니다.");
    });
  }

  function handleDelete() {
    if (!confirm("이 배너를 삭제하시겠습니까?")) return;
    startTransition(async () => {
      await deleteBanner(bannerId);
      toast.success("배너가 삭제되었습니다.");
    });
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className="text-xs text-gray-500 hover:text-black disabled:opacity-50"
      >
        {isActive ? "비활성" : "활성"}
      </button>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
      >
        삭제
      </button>
    </div>
  );
}
