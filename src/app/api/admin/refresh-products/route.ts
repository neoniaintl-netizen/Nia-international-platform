import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCrawler, detectSite } from "@/lib/crawler";
import { requireAdmin } from "@/lib/auth-guards";

/**
 * POST /api/admin/refresh-products
 *   Body: { brandSlug?: string; limit?: number; sourceSite?: string; status?: "ACTIVE"|"DRAFT"|"ALL" }
 *
 * sourceUrl 있는 상품을 재방문해서 imageUrls + description 갱신.
 * variants / price / name은 유지 (브랜드 이름 바뀌지 않도록).
 *
 * GET — 대상 상품 수 리턴 (dry run)
 */

const DEFAULT_DELAY_MS = 600;

async function runRefresh(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const brandSlug: string | undefined = body.brandSlug;
  const sourceSite: string | undefined = body.sourceSite;
  const limit: number = Math.min(Math.max(Number(body.limit) || 50, 1), 200);
  const statusFilter: string = body.status || "ACTIVE";

  const where: any = { sourceUrl: { not: null } };
  if (brandSlug) {
    const b = await prisma.brand.findUnique({
      where: { slug: brandSlug },
      select: { id: true },
    });
    if (!b) return NextResponse.json({ error: "brand not found" }, { status: 404 });
    where.brandId = b.id;
  }
  if (sourceSite) where.sourceSite = sourceSite;
  if (statusFilter !== "ALL") where.status = statusFilter;

  const products = await prisma.product.findMany({
    where,
    select: { id: true, name: true, sourceUrl: true, sourceSite: true },
    take: limit,
  });

  let refreshed = 0;
  let imagesUpdated = 0;
  let descUpdated = 0;
  const errors: Array<{ id: string; name: string; error: string }> = [];

  for (const p of products) {
    if (!p.sourceUrl) continue;
    try {
      const site = p.sourceSite || detectSite(p.sourceUrl);
      const crawler = getCrawler(site);

      const res = await fetch(p.sourceUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
        },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();

      const parsed = crawler.parseProductDetail(html, p.sourceUrl);
      if (!parsed) {
        errors.push({ id: p.id, name: p.name.slice(0, 30), error: "parse failed" });
        continue;
      }

      const updates: any = {};
      if (parsed.description && parsed.description !== undefined) {
        updates.description = parsed.description;
        descUpdated++;
      }

      if (parsed.imageUrls && parsed.imageUrls.length > 0) {
        // HTTP → HTTPS 강제
        const urls = parsed.imageUrls.map((u) =>
          u.startsWith("http://") ? u.replace(/^http:\/\//, "https://") : u
        );
        await prisma.productImage.deleteMany({ where: { productId: p.id } });
        await prisma.productImage.createMany({
          data: urls.map((url, i) => ({
            productId: p.id,
            url,
            alt: p.name,
            sortOrder: i,
            isMain: i === 0,
          })),
        });
        imagesUpdated++;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.product.update({
          where: { id: p.id },
          data: updates,
        });
      }

      refreshed++;
    } catch (err: any) {
      errors.push({
        id: p.id,
        name: p.name.slice(0, 30),
        error: err?.message ?? String(err),
      });
    }

    await new Promise((r) => setTimeout(r, DEFAULT_DELAY_MS));
  }

  return NextResponse.json({
    success: true,
    scanned: products.length,
    refreshed,
    imagesUpdated,
    descUpdated,
    errorCount: errors.length,
    errors: errors.slice(0, 10),
  });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  return runRefresh(req);
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  // 상품 현황 요약
  const stats = await prisma.product.groupBy({
    by: ["sourceSite", "status"],
    where: { sourceUrl: { not: null } },
    _count: { id: true },
  });

  const avgImages = await prisma.$queryRawUnsafe<Array<{ avg: number; min: number; max: number }>>(
    `SELECT AVG(cnt)::int AS avg, MIN(cnt)::int AS min, MAX(cnt)::int AS max FROM (SELECT "productId", COUNT(*)::int AS cnt FROM product_images GROUP BY "productId") AS sub`
  );

  return NextResponse.json({
    bySite: stats,
    images: avgImages[0] ?? null,
  });
}
