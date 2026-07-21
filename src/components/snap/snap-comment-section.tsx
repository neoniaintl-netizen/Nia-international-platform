"use client";

import { useActionState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Send } from "lucide-react";
import { addSnapComment, deleteSnapComment } from "@/actions/snap";
import { useTransition } from "react";
import { useTranslations } from "next-intl";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: { id: string; nickname: string | null; name: string | null };
}

export function SnapCommentSection({ snapId, comments, currentUserId }: { snapId: string; comments: Comment[]; currentUserId?: string }) {
  const [state, formAction, isPending] = useActionState(addSnapComment, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [deleting, startDelete] = useTransition();
  const t = useTranslations("Common");

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-sm">{t("comments")} ({comments.length})</h3>

      {comments.length > 0 ? (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold">{c.user.nickname || c.user.name || t("anonymous")}</p>
                <p className="text-sm text-gray-600">{c.content}</p>
              </div>
              {currentUserId === c.user.id && (
                <button
                  onClick={() => startDelete(async () => { await deleteSnapComment(c.id); })}
                  disabled={deleting}
                  className="text-gray-300 hover:text-red-500 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">{t("firstComment")}</p>
      )}

      {currentUserId && (
        <form ref={formRef} action={(formData) => { formAction(formData); formRef.current?.reset(); }} className="flex gap-2">
          <input type="hidden" name="snapId" value={snapId} />
          <Input name="content" placeholder={t("commentPlaceholder")} className="flex-1 h-9 text-sm" />
          <Button type="submit" size="sm" disabled={isPending} className="h-9 px-3">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      )}
      {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
    </div>
  );
}
