"use client";

import { useTransition } from "react";
import { cancelOrder } from "@/actions/order";
import { toast } from "sonner";

export function OrderCancelButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    if (!confirm("주문을 취소하시겠습니까?")) return;

    startTransition(async () => {
      const result = await cancelOrder(orderId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("주문이 취소되었습니다");
      }
    });
  }

  return (
    <button
      onClick={handleCancel}
      disabled={isPending}
      className="text-xs text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 disabled:opacity-50"
    >
      {isPending ? "취소중..." : "주문취소"}
    </button>
  );
}
