import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-crawl-key");
  if (key !== "nkbus2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const productsWithNoVariants = await prisma.product.findMany({
    where: { variants: { none: {} } },
    select: { id: true, slug: true, name: true },
  });

  let created = 0;
  for (const p of productsWithNoVariants) {
    await prisma.productVariant.create({
      data: {
        productId: p.id,
        sku: `${p.slug}-ONESIZE`.toUpperCase(),
        size: "ONE SIZE",
        stock: 100,
        isActive: true,
      },
    });
    created++;
  }

  return NextResponse.json({
    success: true,
    scanned: productsWithNoVariants.length,
    created,
  });
}

export async function GET(req: NextRequest) {
  const key = req.headers.get("x-crawl-key") || req.nextUrl.searchParams.get("key");
  if (key !== "nkbus2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await prisma.product.count({
    where: { variants: { none: {} } },
  });

  return NextResponse.json({ productsWithNoVariants: count });
}
