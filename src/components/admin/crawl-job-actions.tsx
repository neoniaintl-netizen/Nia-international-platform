"use client";

import { useTransition } from "react";
import {
  cancelCrawlJob,
  approveCrawledProducts,
  deleteCrawledProducts,
  deleteCrawlJob,
} from "@/actions/crawl";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, Trash2, XCircle } from "lucide-react";

export function CrawlJobActions({
  jobId,
  status,
}: {
  jobId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    startTransition(async () => {
      const r = await cancelCrawlJob(jobId);
      if (r.success) toast.success("작업이 취소되었습니다.");
      else toast.error(r.error);
    });
  }

  function handleApprove() {
    if (!confirm("이 작업의 모든 상품을 판매 상태로 승인하시겠습니까?")) return;
    startTransition(async () => {
      const r = await approveCrawledProducts(jobId);
      if (r.success) toast.success(`${r.count}개 상품이 승인되었습니다.`);
      else toast.error(r.error);
    });
  }

  function handleDeleteProducts() {
    if (!confirm("이 작업으로 수집된 모든 상품을 삭제하시겠습니까?")) return;
    startTransition(async () => {
      const r = await deleteCrawledProducts(jobId);
      if (r.success) toast.success(`${r.count}개 상품이 삭제되었습니다.`);
      else toast.error(r.error);
    });
  }

  function handleDeleteJob() {
    if (!confirm("이 크롤링 작업을 삭제하시겠습니까?")) return;
    startTransition(async () => {
      const r = await deleteCrawlJob(jobId);
      if (r.success) toast.success("작업이 삭제되었습니다.");
      else toast.error(r.error);
    });
  }

  return (
    <div className="flex flex-col gap-1.5 shrink-0">
      {(status === "PENDING" || status === "RUNNING") && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={isPending}
          className="text-xs gap-1"
        >
          <XCircle className="w-3.5 h-3.5" /> 취소
        </Button>
      )}
      {status === "COMPLETED" && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleApprove}
            disabled={isPending}
            className="text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50"
          >
            <CheckCircle className="w-3.5 h-3.5" /> 상품 승인
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteProducts}
            disabled={isPending}
            className="text-xs gap-1 text-red-500 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> 상품 삭제
          </Button>
        </>
      )}
      {(status === "COMPLETED" || status === "FAILED" || status === "CANCELLED") && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDeleteJob}
          disabled={isPending}
          className="text-xs text-gray-400 gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> 작업 삭제
        </Button>
      )}
    </div>
  );
}
