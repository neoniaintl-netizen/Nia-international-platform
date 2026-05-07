import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCrawler, detectSite } from "@/lib/crawler";
import { requireAdmin } from "@/lib/auth-guards";

/**
 * POST /api/admin/refresh-product-images
 *   Body: { brands?: string[] }  // 미지정 시 sourceUrl 있는 모든 상품
 *
 * 기존 상품의 sourceUrl을 재방문해 **이미지 URL만** 새로 수집 & 저장.
 * 상품명/가격/slug/status 등 다른 필드는 건드리지 않음.
 * ACTIVE 상품이면 ACTIVE 유지.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const brandSlugs: string[] | undefined = body?.brands;

  // 대상 상품 조회
  const where: any = {
    sourceUrl: { not: null },
    status: { in: ["ACTIVE", "DRAFT"] },
  };
  if (brandSlugs?.length) {
    const brands = await prisma.brand.findMany({
      where: { slug: { in: brandSlugs } },
      select: { id: true },
    });
    where.brandId = { in: brands.map((b) => b.id) };
  }

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      sourceUrl: true,
      sourceSite: true,
      brand: { select: { slug: true } },
    },
    take: 200,
  });

  const summary = {
    total: products.length,
    refreshed: 0,
    unchanged: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const p of products) {
    try {
      const site = p.sourceSite || detectSite(p.sourceUrl!);
      if (site === "seed-fallback") {
        // 시드 데이터는 sourceUrl이 가상일 수 있음 — site 재탐지
        const detected = detectSite(p.sourceUrl!);
        if (detected === "generic") {
          summary.unchanged++;
          continue;
        }
      }

      const crawler = getCrawler(site);

      // 상세 페이지 fetch (base-crawler의 fetchHtml 접근 못 하므로 직접 fetch)
      const res = await fetch(p.sourceUrl!, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        summary.failed++;
        summary.errors.push(`${p.name}: HTTP ${res.status}`);
        continue;
      }

      const html = await res.text();
      const parsed = crawler.parseProductDetail(html, p.sourceUrl!);

      if (!parsed || !parsed.imageUrls || parsed.imageUrls.length === 0) {
        summary.failed++;
        summary.errors.push(`${p.name}: 이미지 추출 실패`);
        continue;
      }

      // 기존 이미지 모두 삭제 후 새로 생성
      await prisma.productImage.deleteMany({
        where: { productId: p.id },
      });

      await prisma.productImage.createMany({
        data: parsed.imageUrls.slice(0, 6).map((url, index) => ({
          productId: p.id,
          url,
          alt: p.name,
          sortOrder: index,
          isMain: index === 0,
        })),
      });

      summary.refreshed++;

      // Rate limiting
      await new Promise((r) => setTimeout(r, 500));
    } catch (err: any) {
      summary.failed++;
      summary.errors.push(`${p.name}: ${err.message}`);
    }
  }

  return NextResponse.json({
    success: true,
    summary,
  });
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const stats = await prisma.product.findMany({
    where: { sourceUrl: { not: null } },
    select: {
      brand: { select: { slug: true } },
      _count: { select: { images: true } },
    },
  });

  const byBrand: Record<string, { total: number; withImages: number }> = {};
  for (const p of stats) {
    const slug = p.brand.slug;
    if (!byBrand[slug]) byBrand[slug] = { total: 0, withImages: 0 };
    byBrand[slug].total++;
    if (p._count.images > 0) byBrand[slug].withImages++;
  }

  return NextResponse.json({ byBrand });
}
