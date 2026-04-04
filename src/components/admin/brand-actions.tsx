"use client";

import { useTransition } from "react";
import { deleteBrand } from "@/actions/admin";
import { toast } from "sonner";

export function BrandActions({
  brandId,
  hasProducts,
}: {
  brandId: string;
  hasProducts: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("이 브랜드를 삭제하시겠습니까?")) return;
    startTransition(async () => {
      const r = await deleteBrand(brandId);
      if (r.success) toast.success("브랜드가 삭제되었습니다.");
      else toast.error(r.error);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending || hasProducts}
      className="text-xs text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
      title={hasProducts ? "상품이 연결되어 삭제할 수 없습니다" : "삭제"}
    >
      삭제
    </button>
  );
}
