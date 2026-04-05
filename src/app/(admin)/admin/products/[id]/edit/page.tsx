import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, brands, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: [{ color: "asc" }, { size: "asc" }] },
      },
    }),
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

  if (!product) return notFound();

  const productData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    brandId: product.brandId,
    categoryId: product.categoryId,
    originalPrice: product.originalPrice,
    salePrice: product.salePrice,
    status: product.status,
    isNew: product.isNew,
    isBest: product.isBest,
    images: product.images.map((img) => ({
      url: img.url,
      alt: img.alt ?? "",
      isMain: img.isMain,
    })),
    variants: product.variants.map((v) => ({
      id: v.id,
      color: v.color ?? "",
      size: v.size ?? "",
      sku: v.sku ?? "",
      stock: v.stock,
      isActive: v.isActive,
    })),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/products/${id}`}
          className="p-1 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">상품 수정</h1>
          <p className="text-xs text-gray-400 mt-0.5">{product.name}</p>
        </div>
      </div>

      <ProductForm
        brands={brands}
        categories={categories}
        product={productData}
      />
    </div>
  );
}
