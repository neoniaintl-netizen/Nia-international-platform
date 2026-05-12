import { NextRequest, NextResponse } from "next/server";
import { requireOpsToken } from "@/lib/ops-auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const block = requireOpsToken(req);
  if (block) return block;

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
  const block = requireOpsToken(req);
  if (block) return block;

  const count = await prisma.product.count({
    where: { variants: { none: {} } },
  });

  return NextResponse.json({ productsWithNoVariants: count });
}
