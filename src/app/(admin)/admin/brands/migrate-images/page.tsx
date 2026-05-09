"use client";

import { useState } from "react";

interface MigrationResult {
  ok: boolean;
  dryRun: boolean;
  summary: {
    brandsProcessed: number;
    totalToUpdate: number;
    totalUpdated: number;
  };
  results: Array<{
    brandSlug: string;
    pool: number;
    productsTotal: number;
    productsToUpdate: number;
    productsUpdated?: number;
    skipped: number;
    notFound?: boolean;
    sampleNew?: string[][];
  }>;
}

interface RefreshResult {
  ok: boolean;
  dryRun: boolean;
  summary: {
    processed: number;
    withImages: number;
    updated: number;
    errors: number;
  };
  results: Array<{
    productId: string;
    productName: string;
    brandSlug: string | null;
    sourceUrl: string;
    extracted?: number;
    extractedSample?: string[];
    updated?: boolean;
    error?: string;
  }>;
}

export default function MigrateImagesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [refreshResult, setRefreshResult] = useState<RefreshResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [refreshLimit, setRefreshLimit] = useState(30);
  const [refreshBrand, setRefreshBrand] = useState("");

  async function run(dryRun: boolean, force: boolean = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/migrate-static-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun, force }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(JSON.stringify(data));
        return;
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function runRefresh(dryRun: boolean) {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { dryRun, limit: refreshLimit };
      if (refreshBrand.trim()) body.brandSlug = refreshBrand.trim();
      const res = await fetch("/api/admin/refresh-from-source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(JSON.stringify(data));
        return;
      }
      setRefreshResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">브랜드 이미지 일괄 마이그</h1>
        <p className="mt-2 text-sm text-gray-600">
          static-brand-images.ts에 담긴 9개 브랜드의 정적 이미지 풀로
          placehold.co URL을 가진 상품들의 이미지를 일괄 교체합니다.
          <br />
          이미 진짜 이미지가 등록된 상품은 건너뜁니다 (수동 매핑 보호).
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-3 items-center flex-wrap">
          <button
            onClick={() => run(true, false)}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium disabled:opacity-50"
          >
            {loading ? "실행 중..." : "dryRun (placeholder만)"}
          </button>
          <button
            onClick={() => run(false, false)}
            disabled={loading}
            className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded text-sm font-medium disabled:opacity-50"
          >
            적용 (placeholder만)
          </button>
          <span className="text-xs text-gray-400 ml-2">|</span>
          <button
            onClick={() => run(true, true)}
            disabled={loading}
            className="px-4 py-2 bg-yellow-50 border border-yellow-300 hover:bg-yellow-100 rounded text-sm font-medium disabled:opacity-50"
          >
            dryRun (force: 모든 상품)
          </button>
          <button
            onClick={() => run(false, true)}
            disabled={loading}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-medium disabled:opacity-50"
          >
            🔄 force 적용 (정밀 이미지로 모두 갱신)
          </button>
        </div>
        <p className="text-xs text-gray-500">
          <strong>placeholder만</strong>: placehold.co URL을 가진 상품만 교체
          (수동 등록한 진짜 이미지 보호) ·{" "}
          <strong>force</strong>: 모든 상품 이미지를 정적 풀로 갱신 (이전
          마이그가 hero/marketing 이미지를 박아놓은 경우 정밀 이미지로 교체할 때
          사용)
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="font-medium text-red-700 mb-1">에러</p>
          <pre className="text-xs text-red-600 whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <p className="font-medium text-green-800">
              {result.dryRun ? "🔍 dryRun 결과" : "✅ 실제 적용 완료"}
            </p>
            <p className="text-sm text-green-700 mt-1">
              브랜드 {result.summary.brandsProcessed}개 처리,{" "}
              {result.dryRun
                ? `${result.summary.totalToUpdate}개 상품이 영향받음 (미적용)`
                : `${result.summary.totalUpdated}개 상품 업데이트됨`}
            </p>
          </div>

          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-medium">브랜드</th>
                  <th className="text-right p-3 font-medium">이미지풀</th>
                  <th className="text-right p-3 font-medium">전체 상품</th>
                  <th className="text-right p-3 font-medium">대상 상품</th>
                  <th className="text-right p-3 font-medium">건너뜀</th>
                  <th className="text-right p-3 font-medium">결과</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((r) => (
                  <tr
                    key={r.brandSlug}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-3 font-mono text-xs">{r.brandSlug}</td>
                    <td className="text-right p-3">{r.pool}</td>
                    <td className="text-right p-3">{r.productsTotal}</td>
                    <td className="text-right p-3 font-medium">
                      {r.productsToUpdate}
                    </td>
                    <td className="text-right p-3 text-gray-500">
                      {r.skipped}
                    </td>
                    <td className="text-right p-3">
                      {r.notFound ? (
                        <span className="text-orange-600 text-xs">
                          brand 없음
                        </span>
                      ) : r.pool === 0 ? (
                        <span className="text-gray-400 text-xs">
                          이미지풀 비어있음
                        </span>
                      ) : result.dryRun ? (
                        <span className="text-blue-600 text-xs">
                          미리보기
                        </span>
                      ) : (
                        <span className="text-green-700 font-medium">
                          {r.productsUpdated} 업데이트
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.dryRun && (
            <details className="text-xs">
              <summary className="cursor-pointer font-medium text-gray-700 py-2">
                매핑될 이미지 샘플 보기
              </summary>
              <pre className="bg-gray-50 p-3 rounded overflow-auto max-h-96">
                {JSON.stringify(
                  result.results.map((r) => ({
                    brandSlug: r.brandSlug,
                    sampleNew: r.sampleNew,
                  })),
                  null,
                  2
                )}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* ── 정밀 매핑: sourceUrl 기반 ── */}
      <div className="mt-10 pt-8 border-t space-y-4">
        <div>
          <h2 className="text-xl font-bold">정밀: sourceUrl로 og:image 갱신</h2>
          <p className="mt-2 text-sm text-gray-600">
            각 상품의 <code>sourceUrl</code>(원본 상품 페이지 URL)을 직접 fetch해서
            og:image 또는 JSON-LD product 이미지를 추출. 1:1 정확 매칭.
            PXG 등 9개 brand에 없는 brand의 mismatch를 해결할 때 유용.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            한 번에 limit 개만 처리 (timeout 방지). 더 많은 상품은 여러 번 호출.
          </p>
        </div>

        <div className="flex gap-3 items-center flex-wrap">
          <label className="text-sm">
            limit:{" "}
            <input
              type="number"
              value={refreshLimit}
              min={1}
              max={100}
              onChange={(e) => setRefreshLimit(Number(e.target.value) || 30)}
              className="border rounded px-2 py-1 w-20 ml-1"
            />
          </label>
          <label className="text-sm">
            brandSlug (선택):{" "}
            <input
              type="text"
              value={refreshBrand}
              placeholder="예: pxg, peltgolf"
              onChange={(e) => setRefreshBrand(e.target.value)}
              className="border rounded px-2 py-1 w-40 ml-1"
            />
          </label>
        </div>

        <div className="flex gap-3 items-center flex-wrap">
          <button
            onClick={() => runRefresh(true)}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium disabled:opacity-50"
          >
            {loading ? "실행 중..." : "dryRun (sourceUrl 미리보기)"}
          </button>
          <button
            onClick={() => runRefresh(false)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium disabled:opacity-50"
          >
            🔍 sourceUrl 적용
          </button>
        </div>

        {refreshResult && (
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="font-medium text-blue-900">
                {refreshResult.dryRun ? "🔍 dryRun" : "✅ 적용 완료"}
              </p>
              <p className="text-sm text-blue-800 mt-1">
                처리 {refreshResult.summary.processed}개 / 이미지 추출{" "}
                {refreshResult.summary.withImages}개 / 업데이트{" "}
                {refreshResult.summary.updated}개 / 에러{" "}
                {refreshResult.summary.errors}개
              </p>
            </div>

            <details className="text-xs">
              <summary className="cursor-pointer font-medium text-gray-700 py-2">
                상세 결과 보기 ({refreshResult.results.length}건)
              </summary>
              <div className="bg-gray-50 p-3 rounded overflow-auto max-h-96 space-y-2">
                {refreshResult.results.map((r) => (
                  <div
                    key={r.productId}
                    className={`p-2 rounded ${
                      r.error
                        ? "bg-red-50"
                        : r.updated
                          ? "bg-green-50"
                          : "bg-white"
                    }`}
                  >
                    <p className="font-medium">{r.productName}</p>
                    <p className="text-gray-500 text-[10px] truncate">
                      {r.sourceUrl}
                    </p>
                    {r.error ? (
                      <p className="text-red-700">에러: {r.error}</p>
                    ) : (
                      <p>
                        추출: {r.extracted}개 ·{" "}
                        {r.updated ? "✅ 업데이트됨" : "(dryRun)"}
                      </p>
                    )}
                    {r.extractedSample && r.extractedSample.length > 0 && (
                      <p className="text-[10px] text-blue-700 truncate">
                        {r.extractedSample[0]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
