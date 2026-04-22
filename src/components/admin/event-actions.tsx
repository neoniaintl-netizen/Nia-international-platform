"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import {
  toggleEventPublishAction,
  deleteEventAction,
} from "@/actions/event";

export function EventActions({
  eventId,
  isPublished,
}: {
  eventId: string;
  isPublished: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleEventPublishAction(eventId);
    });
  }

  function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까? 되돌릴 수 없습니다.")) return;
    startTransition(async () => {
      await deleteEventAction(eventId);
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        disabled={isPending}
        className="h-8 w-8"
        title={isPublished ? "비공개" : "공개"}
      >
        {isPublished ? (
          <EyeOff className="w-3.5 h-3.5" />
        ) : (
          <Eye className="w-3.5 h-3.5" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={isPending}
        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
        title="삭제"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
