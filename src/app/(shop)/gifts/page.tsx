import Link from "next/link";
import { ChevronRight, Gift } from "lucide-react";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product/product-card";
import { toProductCard } from "@/lib/mappers";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "GIFTS | NKBUS",
  description:
    "소중한 사람에게 전하는 선물 — 가격대별, 대상별로 엄선한 선물 큐레이션",
};

const PRICE_RANGES = [
  { label: "~3만원", max: 30000 },
  { label: "3만원~5만원", min: 30000, max: 50000 },
  { label: "5만원~10만원", min: 50000, max: 100000 },
  { label: "10만원~30만원", min: 100000, max: 300000 },
  { label: "30만원 이상", min: 300000 },
];

export default async function GiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ price?: string }>;
}) {
  const { price } = await searchParams;
  const rangeIdx = price ? Number(price) : -1;
  const range = PRICE_RANGES[rangeIdx];

  const priceWhere = range
    ? {
        originalPrice: {
          ...(range.min ? { gte: range.min } : {}),
          ...(range.max ? { lte: range.max } : {}),
        },
      }
    : {};

  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ isGift: true }, { isBest: true }],
      ...priceWhere,
    },
    include: {
      brand: { select: { name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: [{ isGift: "desc" }, { reviewAvg: "desc" }],
    take: 60,
  });

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
        <Link href="/" className="hover:text-black">홈</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-black font-medium">GIFTS</span>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-2xl p-6 lg:p-10 mb-8">
        <Gift className="w-10 h-10 mb-3" />
        <p className="text-xs font-bold opacity-80 mb-2">NKBUS GIFTS</p>
        <h1 className="text-2xl lg:text-4xl font-black mb-2">
          소중한 사람에게, 완벽한 선물
        </h1>
        <p className="text-sm opacity-90">
          가격대별로 엄선한 선물 큐레이션. 기프트 포장·카드까지 무료 제공.
        </p>
      </div>

      {/* Price filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Link
          href="/gifts"
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border ${
            rangeIdx === -1
              ? "bg-black text-white border-black"
              : "border-gray-300 text-gray-500 hover:border-black hover:text-black"
          }`}
        >
          전체
        </Link>
        {PRICE_RANGES.map((r, i) => (
          <Link
            key={r.label}
            href={`/gifts?price=${i}`}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border ${
              rangeIdx === i
                ? "bg-black text-white border-black"
                : "border-gray-300 text-gray-500 hover:border-black hover:text-black"
            }`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          총 <span className="font-bold text-black">{products.length}</span>개
        </p>
      </div>

      <Separator className="mb-6" />

      {products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">해당 가격대 상품이 없습니다</p>
          <p className="text-sm">다른 가격대를 선택해보세요.</p>
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
