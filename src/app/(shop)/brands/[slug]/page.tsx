import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/product/product-card";
import { Pagination } from "@/components/product/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Share2, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAllProducts } from "@/lib/queries";
import { toProductCard } from "@/lib/mappers";
import { SortTabs } from "@/components/product/sort-tabs";
import { BrandFollowButton } from "@/components/brand/brand-follow-button";
import { isFollowingBrand } from "@/actions/brand-follow";
import { Suspense } from "react";

const PAGE_SIZE = 20;

const TABS = [
  { key: "", label: "상품" },
  { key: "about", label: "소개" },
  { key: "lookbook", label: "룩북" },
  { key: "campaign", label: "캠페인" },
  { key: "review", label: "리뷰" },
] as const;

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string; tab?: string }>;
}) {
  const { slug } = await params;
  const { sort, page, tab } = await searchParams;
  const activeTab = tab ?? "";
  const currentPage = Math.max(1, Number(page) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const brand = await prisma.brand.findUnique({
    where: { slug },
    include: {
      lookbooks: {
        where: { isPublished: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: 12,
      },
      campaigns: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: 12,
      },
    },
  });

  if (!brand) return notFound();

  const [followingState, productData] = await Promise.all([
    isFollowingBrand(brand.id),
    getAllProducts({
      brandSlug: slug,
      sort: sort ?? "popular",
      limit: PAGE_SIZE,
      offset,
    }),
  ]);

  const { products, total } = productData;

  return (
    <div>
      {/* Brand header */}
      <div className="bg-gray-900 text-white relative overflow-hidden">
        {brand.coverImageUrl && (
          <div className="absolute inset-0 opacity-30">
            <Image
              src={brand.coverImageUrl}
              alt={brand.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-10 md:py-16 relative">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-4xl font-black">{brand.name}</h1>
              {brand.nameKo && (
                <p className="text-white/60 mt-2 text-sm md:text-base">
                  {brand.nameKo}
                </p>
              )}
              {brand.description && (
                <p className="text-white/40 text-xs md:text-sm mt-3 max-w-lg">
                  {brand.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-4">
                <Badge
                  variant="outline"
                  className="text-white/60 border-white/20 text-xs"
                >
                  팔로워 {brand.followerCount.toLocaleString()}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-white/60 border-white/20 text-xs"
                >
                  상품 {total.toLocaleString()}개
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BrandFollowButton
                brandId={brand.id}
                initialFollowing={followingState}
                initialCount={brand.followerCount}
              />
              <Button
                variant="outline"
                size="icon"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-white/10">
          <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
            <div className="flex items-center gap-6 overflow-x-auto">
              {TABS.map((t) => {
                const isActive = activeTab === t.key;
                const href = t.key
                  ? `/brands/${slug}?tab=${t.key}`
                  : `/brands/${slug}`;
                return (
                  <Link
                    key={t.key}
                    href={href}
                    className={`py-3 text-sm font-bold whitespace-nowrap border-b-2 ${
                      isActive
                        ? "border-white text-white"
                        : "border-transparent text-white/50 hover:text-white"
                    }`}
                  >
                    {t.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
        {/* About */}
        {activeTab === "about" && (
          <div className="max-w-2xl py-8">
            <h2 className="text-xl font-bold mb-4">브랜드 소개</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {brand.description ?? "브랜드 소개가 준비 중입니다."}
            </p>
          </div>
        )}

        {/* Lookbook */}
        {activeTab === "lookbook" && (
          <div className="py-4">
            {brand.lookbooks.length === 0 ? (
              <div className="text-center py-20 text-gray-400 text-sm">
                아직 등록된 룩북이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
                {brand.lookbooks.map((lb) => (
                  <Link
                    key={lb.id}
                    href={`/lookbook/${lb.slug}`}
                    className="group block"
                  >
                    <div className="relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden mb-2">
                      <Image
                        src={lb.coverImage}
                        alt={lb.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {lb.season && (
                        <div className="absolute top-3 left-3 bg-white/90 text-black text-[10px] font-bold px-2 py-1 rounded">
                          {lb.season}
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-sm group-hover:underline">
                      {lb.title}
                    </h3>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Campaign */}
        {activeTab === "campaign" && (
          <div className="py-4">
            {brand.campaigns.length === 0 ? (
              <div className="text-center py-20 text-gray-400 text-sm">
                진행 중인 캠페인이 없습니다.
              </div>
            ) : (
              <div className="space-y-5">
                {brand.campaigns.map((c) => (
                  <Link
                    key={c.id}
                    href={c.linkUrl ?? "#"}
                    className="group block relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden"
                  >
                    <Image
                      src={c.imageUrl}
                      alt={c.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6 lg:p-10 text-white">
                      <h3 className="text-xl lg:text-3xl font-black mb-1">
                        {c.title}
                      </h3>
                      {c.subtitle && (
                        <p className="text-sm opacity-90">{c.subtitle}</p>
                      )}
                      {c.linkUrl && (
                        <p className="text-xs font-bold mt-3 opacity-90 flex items-center gap-1">
                          자세히 보기 <ChevronRight className="w-3 h-3" />
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Review (placeholder) */}
        {activeTab === "review" && (
          <div className="py-8 text-center text-sm text-gray-400">
            리뷰는 각 상품 페이지에서 확인하실 수 있습니다.
          </div>
        )}

        {/* Default: Products */}
        {activeTab === "" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                총 <span className="font-bold text-black">{total}</span>개
              </p>
              <Suspense>
                <SortTabs />
              </Suspense>
            </div>
            <Separator className="mb-6" />
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={toProductCard(product)}
                    />
                  ))}
                </div>
                <Suspense>
                  <Pagination total={total} pageSize={PAGE_SIZE} />
                </Suspense>
              </>
            ) : (
              <div className="text-center py-20 text-gray-400 text-sm">
                등록된 상품이 없습니다.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
