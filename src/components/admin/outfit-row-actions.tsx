"use client";

import { useTransition } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { toggleOutfitPublishAction, deleteOutfitAction } from "@/actions/outfit";

export function OutfitRowActions({ id, isPublished }: { id: string; isPublished: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleOutfitPublishAction(id);
      if (res.error) toast.error(res.error);
      else toast.success(res.isPublished ? "공개되었습니다." : "비공개로 전환했습니다.");
    });
  }

  function handleDelete() {
    if (!confirm("이 코디를 삭제하시겠습니까?")) return;
    startTransition(async () => {
      await deleteOutfitAction(id);
      toast.success("삭제되었습니다.");
    });
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className="text-gray-400 hover:text-black p-1 disabled:opacity-50"
        aria-label={isPublished ? "비공개로" : "공개"}
      >
        {isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      </button>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="text-gray-300 hover:text-red-500 p-1 disabled:opacity-50"
        aria-label="삭제"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
