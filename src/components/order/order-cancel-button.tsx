"use client";

import { useTransition } from "react";
import { cancelOrder } from "@/actions/order";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function OrderCancelButton({ orderId }: { orderId: string }) {
  const t = useTranslations("Mypage");
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    if (!confirm(t("cancelOrderConfirm"))) return;

    startTransition(async () => {
      const result = await cancelOrder(orderId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(t("orderCancelled"));
      }
    });
  }

  return (
    <button
      onClick={handleCancel}
      disabled={isPending}
      className="text-xs text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 disabled:opacity-50"
    >
      {isPending ? t("cancelling") : t("cancelOrder")}
    </button>
  );
}
