import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { DraftBulkClient, type DraftRow } from "@/components/admin/draft-bulk-client";

/**
 * 크롤링 DRAFT 일괄 처리 — 브랜드/사이트/가격 필터 후 bulk ACTIVE 승격 / bulk 삭제.
 */
export default async function AdminDraftsPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string; brand?: string; minPrice?: string; maxPrice?: string }>;
}) {
  const sp = await searchParams;
  const site = sp.site ?? "";
  const brand = sp.brand ?? "";
  const minPrice = sp.minPrice ?? "";
  const maxPrice = sp.maxPrice ?? "";

  const priceFilter: { gte?: number; lte?: number } = {};
  if (minPrice && !isNaN(Number(minPrice))) priceFilter.gte = Number(minPrice);
  if (maxPrice && !isNaN(Number(maxPrice))) priceFilter.lte = Number(maxPrice);

  const where = {
    status: "DRAFT" as const,
    ...(site ? { sourceSite: site } : {}),
    ...(brand ? { brand: { name: { contains: brand, mode: "insensitive" as const } } } : {}),
    ...(Object.keys(priceFilter).length ? { originalPrice: priceFilter } : {}),
  };

  const [products, total, siteGroups] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        originalPrice: true,
        sourceSite: true,
        brand: { select: { name: true } },
        _count: { select: { images: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.product.count({ where }),
    prisma.product.groupBy({ by: ["sourceSite"], where: { status: "DRAFT" }, _count: true }),
  ]);

  const rows: DraftRow[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    brandName: p.brand.name,
    sourceSite: p.sourceSite,
    originalPrice: p.originalPrice,
    imageCount: p._count.images,
  }));
  // 사이트별 DRAFT 카운트 (터미널 쿼리 대신 화면에서 확인)
  const siteCounts = siteGroups
    .map((g) => ({ site: g.sourceSite ?? "(미지정)", count: g._count }))
    .sort((a, b) => b.count - a.count);
  const sites = siteGroups.map((g) => g.sourceSite).filter((s): s is string => !!s).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">DRAFT 일괄 처리</h1>
        <Badge variant="outline">{total}개 (표시 최대 200)</Badge>
      </div>
      <p className="text-sm text-gray-500">
        크롤링으로 수집된 검수대기 상품을 브랜드/사이트/가격으로 필터해 일괄 승격·삭제합니다. (승격·삭제 모두 DRAFT만 대상)
      </p>

      {/* 사이트별 DRAFT 카운트 — 크롤 결과를 화면에서 바로 확인 */}
      <div className="rounded-lg border bg-gray-50 p-4">
        <p className="mb-2 text-xs font-semibold text-gray-500">사이트별 DRAFT 수</p>
        {siteCounts.length === 0 ? (
          <p className="text-sm text-gray-400">검수대기 상품이 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {siteCounts.map((s) => (
              <a
                key={s.site}
                href={`/admin/drafts?site=${encodeURIComponent(s.site)}`}
                className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-sm hover:border-black transition-colors"
              >
                <span className="font-medium">{s.site}</span>
                <span className="text-gray-500">{s.count}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      <DraftBulkClient rows={rows} sites={sites} filters={{ site, brand, minPrice, maxPrice }} />
    </div>
  );
}
