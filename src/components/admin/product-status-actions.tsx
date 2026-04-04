"use client";

import { useTransition } from "react";
import { updateProductStatus, deleteProduct } from "@/actions/admin";
import { toast } from "sonner";

const STATUSES = [
  { value: "ACTIVE", label: "판매중" },
  { value: "DRAFT", label: "검수대기" },
  { value: "SOLDOUT", label: "품절" },
  { value: "HIDDEN", label: "숨김" },
  { value: "ARCHIVED", label: "보관" },
];

export function ProductStatusActions({
  productId,
  currentStatus,
}: {
  productId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    startTransition(async () => {
      await updateProductStatus(productId, newStatus);
      toast.success("상태가 변경되었습니다.");
    });
  }

  function handleDelete() {
    if (!confirm("이 상품을 삭제하시겠습니까? 복구할 수 없습니다.")) return;
    startTransition(async () => {
      await deleteProduct(productId);
      toast.success("상품이 삭제되었습니다.");
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={currentStatus}
        onChange={handleStatusChange}
        disabled={isPending}
        className="text-xs border rounded px-1.5 py-1 bg-white disabled:opacity-50"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="text-xs text-red-400 hover:text-red-600 px-1.5 py-1 disabled:opacity-50"
      >
        삭제
      </button>
    </div>
  );
}
