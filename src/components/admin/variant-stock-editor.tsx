"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Check } from "lucide-react";
import { updateVariantStock } from "@/actions/admin";
import { toast } from "sonner";

interface Variant {
  id: string;
  color: string | null;
  size: string | null;
  sku: string | null;
  stock: number;
  isActive: boolean;
}

export function VariantStockEditor({ variants }: { variants: Variant[] }) {
  const [stocks, setStocks] = useState<Record<string, number>>(
    Object.fromEntries(variants.map((v) => [v.id, v.stock]))
  );
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  function handleSave(variantId: string) {
    startTransition(async () => {
      const result = await updateVariantStock(variantId, stocks[variantId]);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("재고가 업데이트되었습니다.");
        setSaved((prev) => ({ ...prev, [variantId]: true }));
        setTimeout(() => setSaved((prev) => ({ ...prev, [variantId]: false })), 2000);
      }
    });
  }

  function handleSaveAll() {
    startTransition(async () => {
      let success = 0;
      let failed = 0;
      for (const v of variants) {
        if (stocks[v.id] !== v.stock) {
          const result = await updateVariantStock(v.id, stocks[v.id]);
          if (result.error) failed++;
          else success++;
        }
      }
      if (success > 0) toast.success(`${success}개 변형의 재고가 업데이트되었습니다.`);
      if (failed > 0) toast.error(`${failed}개 변형의 업데이트에 실패했습니다.`);
    });
  }

  const hasChanges = variants.some((v) => stocks[v.id] !== v.stock);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-3 text-left font-medium text-gray-600">컬러</th>
              <th className="p-3 text-left font-medium text-gray-600">사이즈</th>
              <th className="p-3 text-left font-medium text-gray-600">SKU</th>
              <th className="p-3 text-left font-medium text-gray-600">상태</th>
              <th className="p-3 text-left font-medium text-gray-600">재고</th>
              <th className="p-3 text-left font-medium text-gray-600">저장</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => (
              <tr key={v.id} className="border-b last:border-0">
                <td className="p-3">{v.color || "-"}</td>
                <td className="p-3 font-medium">{v.size || "-"}</td>
                <td className="p-3 text-xs text-gray-400 font-mono">{v.sku || "-"}</td>
                <td className="p-3">
                  <Badge
                    className={`text-[10px] ${
                      v.isActive
                        ? stocks[v.id] > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {!v.isActive ? "비활성" : stocks[v.id] > 0 ? "판매중" : "품절"}
                  </Badge>
                </td>
                <td className="p-3">
                  <Input
                    type="number"
                    min="0"
                    value={stocks[v.id]}
                    onChange={(e) =>
                      setStocks((prev) => ({
                        ...prev,
                        [v.id]: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-24 h-8 text-sm"
                  />
                </td>
                <td className="p-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2"
                    onClick={() => handleSave(v.id)}
                    disabled={isPending || stocks[v.id] === v.stock}
                  >
                    {saved[v.id] ? (
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    ) : isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasChanges && (
        <div className="flex justify-end">
          <Button
            onClick={handleSaveAll}
            disabled={isPending}
            className="bg-black hover:bg-gray-800 text-white gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            변경사항 일괄 저장
          </Button>
        </div>
      )}
    </div>
  );
}
