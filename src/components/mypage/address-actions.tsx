"use client";

import { useTransition } from "react";
import { deleteAddress, setDefaultAddress } from "@/actions/profile";
import { toast } from "sonner";

export function AddressActions({ addressId, isDefault }: { addressId: string; isDefault: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("배송지를 삭제하시겠습니까?")) return;
    startTransition(async () => {
      await deleteAddress(addressId);
      toast.success("배송지가 삭제되었습니다");
    });
  }

  function handleSetDefault() {
    startTransition(async () => {
      await setDefaultAddress(addressId);
      toast.success("기본 배송지로 설정되었습니다");
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
          기본 설정
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="text-xs text-red-500 border border-red-200 rounded-lg px-2.5 py-1 hover:bg-red-50 disabled:opacity-50"
      >
        삭제
      </button>
    </div>
  );
}
