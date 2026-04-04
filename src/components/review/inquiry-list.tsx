"use client";

import { Lock, MessageSquare, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteInquiry } from "@/actions/inquiry";
import { useTransition, useState } from "react";
import { toast } from "sonner";

type InquiryItem = {
  id: string;
  title: string;
  content: string;
  isSecret: boolean;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
  user: { id: string; nickname: string | null; name: string | null };
};

export function InquiryList({
  inquiries,
  total,
  currentUserId,
}: {
  inquiries: InquiryItem[];
  total: number;
  currentUserId?: string;
}) {
  if (total === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-200" />
        <p>등록된 문의가 없습니다.</p>
        <p className="mt-1">궁금한 점이 있으면 문의해주세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <p className="text-sm text-gray-500 mb-4">총 {total}건의 문의</p>
      {inquiries.map((inquiry) => (
        <InquiryRow
          key={inquiry.id}
          inquiry={inquiry}
          isOwner={currentUserId === inquiry.user.id}
          canView={!inquiry.isSecret || currentUserId === inquiry.user.id}
        />
      ))}
    </div>
  );
}

function InquiryRow({
  inquiry,
  isOwner,
  canView,
}: {
  inquiry: InquiryItem;
  isOwner: boolean;
  canView: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const displayName = inquiry.user.nickname || inquiry.user.name || "익명";
  const maskedName =
    displayName.length > 1
      ? displayName[0] + "*".repeat(displayName.length - 1)
      : displayName;
  const date = new Date(inquiry.createdAt).toLocaleDateString("ko-KR");

  function handleDelete() {
    if (!confirm("문의를 삭제하시겠습니까?")) return;
    startTransition(async () => {
      const result = await deleteInquiry(inquiry.id);
      if (result.success) toast.success("문의가 삭제되었습니다.");
      else toast.error(result.error);
    });
  }

  return (
    <div className="border-b last:border-0">
      {/* Question header */}
      <button
        onClick={() => canView && setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 px-2 -mx-2 rounded"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Badge
            variant="outline"
            className={`text-[10px] shrink-0 ${
              inquiry.answer ? "text-green-600 border-green-200" : "text-gray-400"
            }`}
          >
            {inquiry.answer ? "답변완료" : "답변대기"}
          </Badge>
          {inquiry.isSecret && <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
          <span className="text-sm truncate">
            {canView ? inquiry.title : "비밀글입니다."}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <span className="text-xs text-gray-400">{maskedName}</span>
          <span className="text-xs text-gray-400">{date}</span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && canView && (
        <div className="pb-4 px-2 -mx-2 space-y-3">
          {/* Question */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm leading-relaxed">{inquiry.content}</p>
            {isOwner && (
              <div className="mt-2 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="text-xs text-red-400 hover:text-red-600 gap-1 h-7 px-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 삭제
                </Button>
              </div>
            )}
          </div>

          {/* Answer */}
          {inquiry.answer && (
            <div className="bg-blue-50 rounded-lg p-4 ml-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Badge className="bg-black text-white text-[10px]">판매자</Badge>
                {inquiry.answeredAt && (
                  <span className="text-[10px] text-gray-400">
                    {new Date(inquiry.answeredAt).toLocaleDateString("ko-KR")}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed">{inquiry.answer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
