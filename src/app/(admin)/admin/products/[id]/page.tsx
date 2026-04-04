import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ChevronLeft } from "lucide-react";
import { VariantStockEditor } from "@/components/admin/variant-stock-editor";
import Link from "next/link";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "검수대기", color: "bg-yellow-100 text-yellow-700" },
  ACTIVE: { label: "판매중", color: "bg-green-100 text-green-700" },
  SOLDOUT: { label: "품절", color: "bg-red-100 text-red-700" },
  HIDDEN: { label: "비노출", color: "bg-gray-100 text-gray-500" },
  ARCHIVED: { label: "보관", color: "bg-gray-100 text-gray-400" },
};

export default async function AdminProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      brand: { select: { name: true } },
      category: { select: { name: true } },
      variants: { orderBy: [{ color: "asc" }, { size: "asc" }] },
      _count: { select: { images: true, reviews: true, orderItems: true } },
    },
  });

  if (!product) return notFound();

  const statusInfo = STATUS_MAP[product.status] ?? { label: product.status, color: "bg-gray-100 text-gray-500" };
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{product.name}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {product.brand.name} | {product.category?.name ?? "-"}
          </p>
        </div>
        <Badge className={`text-sm px-3 py-1 ${statusInfo.color}`}>
          {statusInfo.label}
        </Badge>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400">변형 수</p>
            <p className="text-2xl font-bold mt-1">{product.variants.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400">총 재고</p>
            <p className="text-2xl font-bold mt-1">{totalStock.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400">주문 수</p>
            <p className="text-2xl font-bold mt-1">{product._count.orderItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400">리뷰 수</p>
            <p className="text-2xl font-bold mt-1">{product._count.reviews}</p>
          </CardContent>
        </Card>
      </div>

      {/* Variant stock management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4" /> 재고 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          {product.variants.length > 0 ? (
            <VariantStockEditor
              variants={product.variants.map((v) => ({
                id: v.id,
                color: v.color,
                size: v.size,
                sku: v.sku,
                stock: v.stock,
                isActive: v.isActive,
              }))}
            />
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">등록된 변형이 없습니다.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
