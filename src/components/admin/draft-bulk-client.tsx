"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bulkPromoteDrafts, bulkDeleteDrafts } from "@/actions/admin/draft-bulk";

export interface DraftRow {
  id: string;
  name: string;
  brandName: string;
  sourceSite: string | null;
  originalPrice: number;
  imageCount: number;
}

export function DraftBulkClient({
  rows,
  sites,
  filters,
}: {
  rows: DraftRow[];
  sites: string[];
  filters: { site: string; brand: string; minPrice: string; maxPrice: string };
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string>("");

  const allChecked = rows.length > 0 && selected.size === rows.length;
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)));

  function run(action: "promote" | "delete") {
    const ids = [...selected];
    if (!ids.length) {
      setMsg("선택된 상품이 없습니다.");
      return;
    }
    if (action === "delete" && !confirm(`${ids.length}개 DRAFT 상품을 삭제합니다. 계속?`)) return;
    startTransition(async () => {
      const res =
        action === "promote" ? await bulkPromoteDrafts(ids) : await bulkDeleteDrafts(ids);
      if ("error" in res && res.error) setMsg(`오류: ${res.error}`);
      else setMsg(`${action === "promote" ? "승격" : "삭제"} 완료: ${res.count}개`);
      setSelected(new Set());
      router.refresh();
    });
  }

  // 필터는 GET 폼으로 searchParams 갱신 → 서버에서 재조회
  return (
    <div className="space-y-4">
      <form method="get" className="flex flex-wrap items-end gap-3 p-4 bg-gray-50 rounded-lg">
        <label className="flex flex-col text-xs text-gray-500">
          사이트
          <select name="site" defaultValue={filters.site} className="mt-1 border rounded px-2 py-1.5 text-sm">
            <option value="">전체</option>
            {sites.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs text-gray-500">
          브랜드(포함)
          <input name="brand" defaultValue={filters.brand} className="mt-1 border rounded px-2 py-1.5 text-sm" placeholder="브랜드명" />
        </label>
        <label className="flex flex-col text-xs text-gray-500">
          최소가
          <input name="minPrice" defaultValue={filters.minPrice} type="number" className="mt-1 border rounded px-2 py-1.5 text-sm w-28" />
        </label>
        <label className="flex flex-col text-xs text-gray-500">
          최대가
          <input name="maxPrice" defaultValue={filters.maxPrice} type="number" className="mt-1 border rounded px-2 py-1.5 text-sm w-28" />
        </label>
        <button type="submit" className="px-4 py-1.5 bg-black text-white text-sm rounded-lg">필터</button>
      </form>

      <div className="flex items-center gap-3">
        <button
          onClick={() => run("promote")}
          disabled={pending}
          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg disabled:opacity-50"
        >
          선택 {selected.size}개 → ACTIVE 승격
        </button>
        <button
          onClick={() => run("delete")}
          disabled={pending}
          className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg disabled:opacity-50"
        >
          선택 {selected.size}개 삭제
        </button>
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="p-2 w-10"><input type="checkbox" checked={allChecked} onChange={toggleAll} /></th>
              <th className="p-2 text-left">상품명</th>
              <th className="p-2 text-left">브랜드</th>
              <th className="p-2 text-left">사이트</th>
              <th className="p-2 text-right">원가</th>
              <th className="p-2 text-right">이미지</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="p-2 text-center"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} /></td>
                <td className="p-2 truncate max-w-[320px]">{r.name}</td>
                <td className="p-2">{r.brandName}</td>
                <td className="p-2 text-gray-500">{r.sourceSite ?? "-"}</td>
                <td className="p-2 text-right">{r.originalPrice.toLocaleString()}원</td>
                <td className="p-2 text-right text-gray-500">{r.imageCount}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">조건에 맞는 DRAFT 상품이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
