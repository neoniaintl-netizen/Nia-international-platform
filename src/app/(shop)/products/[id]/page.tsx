import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductImageGallery } from "@/components/product/product-image-gallery";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriceDisplay } from "@/components/shared/price-display";
import { ProductActions } from "@/components/product/product-actions";
import { ReviewStats } from "@/components/review/review-stats";
import { ReviewList } from "@/components/review/review-list";
import { ReviewForm } from "@/components/review/review-form";
import { InquiryList } from "@/components/review/inquiry-list";
import { InquiryForm } from "@/components/review/inquiry-form";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getUserWishlistIds,
  getProductReviews,
  getReviewStats,
  getUserReview,
  getProductInquiries,
} from "@/lib/queries";
import { auth } from "@/lib/auth";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductBySlug(id);

  if (!product) return notFound();

  // Check wishlist status + fetch reviews/inquiries
  const session = await auth();
  let isWishlisted = false;
  let hasReviewed = false;
  if (session?.user?.id) {
    const [wishlistIds, userReview] = await Promise.all([
      getUserWishlistIds(session.user.id),
      getUserReview(session.user.id, product.id),
    ]);
    isWishlisted = wishlistIds.has(product.id);
    hasReviewed = !!userReview;
  }

  const [reviewData, reviewStats, inquiryData] = await Promise.all([
    getProductReviews(product.id),
    getReviewStats(product.id),
    getProductInquiries(product.id),
  ]);

  // Serialize dates for client components
  const serializedReviews = reviewData.reviews.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  const serializedInquiries = inquiryData.inquiries.map((q) => ({
    ...q,
    createdAt: q.createdAt.toISOString(),
    answeredAt: q.answeredAt?.toISOString() ?? null,
  }));

  // Extract unique colors and sizes from variants
  const colors = [...new Set(product.variants.map((v) => v.color).filter(Boolean))] as string[];
  const sizes = [...new Set(product.variants.map((v) => v.size).filter(Boolean))] as string[];

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-4 lg:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16">
        {/* Image gallery */}
        <ProductImageGallery
          images={product.images.map((img) => ({
            id: img.id,
            url: img.url,
            alt: img.alt,
            isMain: img.isMain,
          }))}
          productName={product.name}
          isNew={product.isNew}
        />

        {/* Product info */}
        <div className="space-y-8">
          {/* Brand & Name */}
          <div className="space-y-3">
            <Link
              href={`/brands/${product.brand.slug}`}
              className="eyebrow text-[var(--ink)] hover:text-[var(--champagne)] transition-colors"
            >
              {product.brand.nameKo ?? product.brand.name}
            </Link>
            <h1 className="text-2xl lg:text-[28px] font-normal leading-tight text-[var(--ink)] tracking-[-0.01em]">
              {product.name}
            </h1>
            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-[var(--champagne)] text-[var(--champagne)]" />
                <span className="text-[12px] font-medium num">
                  {product.reviewAvg.toFixed(1)}
                </span>
              </div>
              <span className="text-[11px] text-[var(--ink-muted)] uppercase tracking-[0.1em] num">
                · Review {product.reviewCount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="h-px bg-[var(--line)]" />

          {/* Price */}
          <div className="space-y-3">
            <PriceDisplay
              basePrice={product.originalPrice}
              salePrice={product.salePrice}
              size="lg"
            />
            {product.salePrice && (
              <div className="inline-block">
                <span className="text-[11px] uppercase tracking-[0.15em] border border-[var(--champagne)] text-[var(--champagne)] px-2.5 py-1 num">
                  Member Price{" "}
                  {Math.floor(product.salePrice * 0.85).toLocaleString()}₩
                </span>
              </div>
            )}
          </div>

          <div className="h-px bg-[var(--line)]" />

          {/* Delivery info — editorial list */}
          <ul className="space-y-2 text-[12px] text-[var(--ink-muted)]">
            <li className="flex items-baseline gap-3">
              <span className="eyebrow text-[var(--ink)] min-w-[90px]">Shipping</span>
              <span>무료배송 · 내일 도착 예정</span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="eyebrow text-[var(--ink)] min-w-[90px]">Returns</span>
              <span>30일 이내 무료 반품</span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="eyebrow text-[var(--ink)] min-w-[90px]">Authentic</span>
              <span>NKBUS 정품 보증 · 해외배송 지원</span>
            </li>
          </ul>

          <div className="h-px bg-[var(--line)]" />

          {/* Options + Actions (Client Component) */}
          <ProductActions
            productId={product.id}
            productName={product.name}
            variants={product.variants.map((v) => ({
              id: v.id,
              color: v.color,
              size: v.size,
              stock: v.stock,
              isActive: v.isActive,
            }))}
            colors={colors}
            sizes={sizes}
            isWishlisted={isWishlisted}
            categorySlug={product.category?.parent?.slug ?? product.category?.slug}
          />
        </div>
      </div>

      {/* Product detail tabs */}
      <div className="mt-10 lg:mt-20">
        <Tabs defaultValue="detail">
          <TabsList className="w-full grid grid-cols-3 h-12 border-b border-[var(--line)]">
            <TabsTrigger value="detail" className="text-[10px] md:text-[11px] uppercase tracking-[0.15em] md:tracking-[0.2em] font-medium">
              Details
            </TabsTrigger>
            <TabsTrigger value="reviews" className="text-[10px] md:text-[11px] uppercase tracking-[0.15em] md:tracking-[0.2em] font-medium">
              Reviews
              <span className="num ml-1 hidden sm:inline">({product.reviewCount.toLocaleString()})</span>
              <span className="num ml-1 sm:hidden">{product.reviewCount}</span>
            </TabsTrigger>
            <TabsTrigger value="qna" className="text-[10px] md:text-[11px] uppercase tracking-[0.15em] md:tracking-[0.2em] font-medium">
              Q&amp;A <span className="num ml-1">({inquiryData.total})</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="detail" className="py-12">
            <div className="max-w-3xl mx-auto">
              {product.description ? (
                <div
                  className="product-description text-[14px] leading-relaxed text-[var(--ink)]"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <div className="border border-[var(--line)] bg-[var(--paper)] p-10 text-center text-[13px] text-[var(--ink-muted)] leading-relaxed">
                  <p>상품 상세 이미지가 이곳에 표시됩니다.</p>
                  <p className="mt-3">소재 · 제조국 · 세탁 정보는 상품 업데이트 후 표시됩니다.</p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="py-12">
            <ReviewStats
              total={reviewStats.total}
              avg={reviewStats.avg}
              distribution={reviewStats.distribution}
            />
            {session?.user?.id && (
              <div className="mb-6">
                <ReviewForm productId={product.id} hasReviewed={hasReviewed} />
              </div>
            )}
            <ReviewList
              reviews={serializedReviews}
              total={reviewData.total}
              productId={product.id}
              currentUserId={session?.user?.id}
            />
          </TabsContent>
          <TabsContent value="qna" className="py-12">
            {session?.user?.id && (
              <div className="mb-6">
                <InquiryForm productId={product.id} />
              </div>
            )}
            <InquiryList
              inquiries={serializedInquiries}
              total={inquiryData.total}
              currentUserId={session?.user?.id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
