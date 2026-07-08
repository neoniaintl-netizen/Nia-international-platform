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
    prisma.product.groupBy({ by: ["sourceSite"], where: { status: "DRAFT" } }),
  ]);

  const rows: DraftRow[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    brandName: p.brand.name,
    sourceSite: p.sourceSite,
    originalPrice: p.originalPrice,
    imageCount: p._count.images,
  }));
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
      <DraftBulkClient rows={rows} sites={sites} filters={{ site, brand, minPrice, maxPrice }} />
    </div>
  );
}
