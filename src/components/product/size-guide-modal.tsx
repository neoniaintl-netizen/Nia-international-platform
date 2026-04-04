"use client";

import { Ruler } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SIZE_GUIDE } from "@/lib/size-guide-data";

export function SizeGuideModal({ categorySlug }: { categorySlug?: string }) {
  const guide = SIZE_GUIDE[categorySlug || "default"] || SIZE_GUIDE.default;

  return (
    <Dialog>
      <DialogTrigger render={<button className="text-xs text-gray-400 underline flex items-center gap-1" />}>
        <Ruler className="w-3 h-3" />
        사이즈 가이드
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>사이즈 가이드 ({guide.label})</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-gray-400 mb-3">* 단위: cm (신발은 mm)</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 text-left font-medium text-gray-600">사이즈</th>
                {guide.columns.map((col) => (
                  <th key={col} className="p-2 text-center font-medium text-gray-600">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guide.rows.map((row) => (
                <tr key={row.size} className="border-t">
                  <td className="p-2 font-bold">{row.size}</td>
                  {row.values.map((val, i) => (
                    <td key={i} className="p-2 text-center text-gray-600">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
