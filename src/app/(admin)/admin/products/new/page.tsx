import { prisma } from "@/lib/db";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";

export default async function AdminProductNewPage() {
  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      select: { id: true, name: true, depth: true, parentId: true },
      orderBy: [{ depth: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className="p-1 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">상품 등록</h1>
      </div>

      <ProductForm brands={brands} categories={categories} />
    </div>
  );
}
