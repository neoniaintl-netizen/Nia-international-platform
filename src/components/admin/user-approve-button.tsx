"use client";

import { useTransition } from "react";
import { approveUser, revokeApproval } from "@/actions/admin";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

export function UserApproveButton({
  userId,
  approved,
}: {
  userId: string;
  approved: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  if (approved) {
    return (
      <button
        onClick={() => {
          if (!confirm("이 회원의 승인을 취소하시겠습니까? 취소 시 로그인이 차단됩니다.")) return;
          startTransition(async () => {
            await revokeApproval(userId);
            toast.success("승인이 취소되었습니다.");
          });
        }}
        disabled={isPending}
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors"
      >
        <X className="w-3 h-3" /> 승인취소
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        startTransition(async () => {
          await approveUser(userId);
          toast.success("승인되었습니다.");
        });
      }}
      disabled={isPending}
      className="inline-flex items-center gap-1 text-xs font-medium text-white bg-black hover:bg-gray-800 disabled:opacity-50 rounded px-2.5 py-1 transition-colors"
    >
      <Check className="w-3 h-3" /> 승인
    </button>
  );
}
