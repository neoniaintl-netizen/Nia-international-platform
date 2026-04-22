import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product/product-card";
import { toProductCard } from "@/lib/mappers";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "아울렛 | NKBUS",
  description: "NKBUS 아울렛 — 시즌오프 특가 상품 모음",
};

export default async function OutletPage() {
  // 1차: isOutlet=true 상품
  const outletProducts = await prisma.product.findMany({
    where: { status: "ACTIVE", isOutlet: true },
    include: {
      brand: { select: { name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  // 2차: 할인가가 원가의 50% 이하인 상품(세일 상품 자동 포함)
  const saleProducts = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      salePrice: { not: null },
      NOT: { id: { in: outletProducts.map((p) => p.id) } },
    },
    include: {
      brand: { select: { name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    take: 80,
  });

  // 메모리에서 50% 이하 필터
  const discounted = saleProducts.filter(
    (p) => p.salePrice != null && p.salePrice <= p.originalPrice * 0.5
  );

  const products = [...outletProducts, ...discounted].slice(0, 100);

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
        <Link href="/" className="hover:text-black">홈</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-black font-medium">아울렛</span>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl p-6 lg:p-10 mb-8">
        <p className="text-xs font-bold opacity-80 mb-2">NKBUS OUTLET</p>
        <h1 className="text-2xl lg:text-4xl font-black mb-2">
          시즌오프 특가전
        </h1>
        <p className="text-sm opacity-90">
          한정 수량 · 최대 70% 할인 · 남은 재고 소진 시 종료
        </p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          총 <span className="font-bold text-black">{products.length}</span>개
        </p>
      </div>

      <Separator className="mb-6" />

      {products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">아울렛 상품 준비중입니다</p>
          <p className="text-sm">곧 특가 상품을 만나보실 수 있습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={toProductCard(p)} />
          ))}
        </div>
      )}
    </div>
  );
}
