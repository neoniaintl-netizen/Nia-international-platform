"use client";

import { useTransition } from "react";
import { deleteAddress, setDefaultAddress } from "@/actions/profile";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function AddressActions({ addressId, isDefault }: { addressId: string; isDefault: boolean }) {
  const t = useTranslations("Mypage");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(t("deleteAddrConfirm"))) return;
    startTransition(async () => {
      await deleteAddress(addressId);
      toast.success(t("addrDeleted"));
    });
  }

  function handleSetDefault() {
    startTransition(async () => {
      await setDefaultAddress(addressId);
      toast.success(t("defaultSet"));
    });
  }

  return (
    <div className="flex gap-2 shrink-0">
      {!isDefault && (
        <button
          onClick={handleSetDefault}
          disabled={isPending}
          className="text-xs text-gray-500 border rounded-lg px-2.5 py-1 hover:bg-gray-50 disabled:opacity-50"
        >
          {t("setDefault")}
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="text-xs text-red-500 border border-red-200 rounded-lg px-2.5 py-1 hover:bg-red-50 disabled:opacity-50"
      >
        {t("delete")}
      </button>
    </div>
  );
}
