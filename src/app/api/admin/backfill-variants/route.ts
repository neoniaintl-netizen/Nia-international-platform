import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

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
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const count = await prisma.product.count({
    where: { variants: { none: {} } },
  });

  return NextResponse.json({ productsWithNoVariants: count });
}
