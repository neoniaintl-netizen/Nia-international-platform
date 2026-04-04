"use client";

import { useTransition } from "react";
import { deleteCategory } from "@/actions/admin";
import { toast } from "sonner";

export function CategoryActions({
  categoryId,
  hasProducts,
  hasChildren,
}: {
  categoryId: string;
  hasProducts: boolean;
  hasChildren: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const disabled = hasProducts || hasChildren;

  function handleDelete() {
    if (!confirm("이 카테고리를 삭제하시겠습니까?")) return;
    startTransition(async () => {
      const r = await deleteCategory(categoryId);
      if (r.success) toast.success("카테고리가 삭제되었습니다.");
      else toast.error(r.error);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending || disabled}
      className="text-xs text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
      title={
        hasProducts
          ? "상품이 연결되어 삭제할 수 없습니다"
          : hasChildren
            ? "하위 카테고리가 있어 삭제할 수 없습니다"
            : "삭제"
      }
    >
      삭제
    </button>
  );
}
