import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const key = req.headers.get("x-crawl-key") || req.nextUrl.searchParams.get("key");
  if (key !== "nkbus2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const brandSlug = req.nextUrl.searchParams.get("brand");

  const where: any = { status: "DRAFT" };
  if (brandSlug) {
    const b = await prisma.brand.findUnique({
      where: { slug: brandSlug },
      select: { id: true },
    });
    if (!b) return NextResponse.json({ error: "brand not found" }, { status: 404 });
    where.brandId = b.id;
  }

  const drafts = await prisma.product.findMany({
    where,
    select: {
      id: true,
      slug: true,
      name: true,
      originalPrice: true,
      salePrice: true,
      sourceUrl: true,
      brand: { select: { slug: true } },
      _count: { select: { images: true, variants: true } },
    },
    take: 30,
  });

  return NextResponse.json({
    count: drafts.length,
    sample: drafts.map((p) => ({
      slug: p.slug,
      name: p.name?.slice(0, 40),
      brand: p.brand?.slug,
      originalPrice: p.originalPrice,
      salePrice: p.salePrice,
      images: p._count.images,
      variants: p._count.variants,
      sourceUrl: p.sourceUrl?.slice(0, 80),
    })),
  });
}
