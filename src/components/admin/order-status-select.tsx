"use client";

import { useTransition } from "react";
import { updateOrderStatus } from "@/actions/admin";
import { toast } from "sonner";

const STATUSES = [
  { value: "PENDING", label: "결제대기" },
  { value: "PAID", label: "결제완료" },
  { value: "PREPARING", label: "배송준비" },
  { value: "SHIPPED", label: "배송중" },
  { value: "DELIVERED", label: "배송완료" },
  { value: "CANCELLED", label: "취소" },
  { value: "RETURN_REQUESTED", label: "반품요청" },
  { value: "RETURNED", label: "반품완료" },
];

export function OrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    startTransition(async () => {
      await updateOrderStatus(orderId, newStatus);
      toast.success("주문 상태가 변경되었습니다.");
    });
  }

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      disabled={isPending}
      className="text-xs border rounded px-1.5 py-1 bg-white disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  );
}
