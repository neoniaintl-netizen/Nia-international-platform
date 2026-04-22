"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import {
  toggleLookbookPublishAction,
  deleteLookbookAction,
} from "@/actions/lookbook";

export function LookbookActions({
  id,
  isPublished,
}: {
  id: string;
  isPublished: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleLookbookPublishAction(id);
    });
  }

  function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    startTransition(async () => {
      await deleteLookbookAction(id);
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
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
