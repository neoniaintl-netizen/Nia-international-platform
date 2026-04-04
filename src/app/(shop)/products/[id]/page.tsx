import Image from "next/image";
import { Star, Truck, RotateCcw, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

  const mainImage = product.images.find((img) => img.isMain) ?? product.images[0];

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image gallery */}
        <div className="space-y-3">
          <div className="relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden">
            <Image
              src={mainImage?.url ?? "https://placehold.co/800x1067/c0c0c0/444?text=No+Image"}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
            {product.isNew && (
              <Badge className="absolute top-4 left-4 bg-black text-white">NEW</Badge>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {product.images.map((img) => (
              <div
                key={img.id}
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-black transition-all"
              >
                <Image
                  src={img.url}
                  alt={img.alt ?? product.name}
                  width={200}
                  height={200}
                  className="object-cover w-full h-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Product info */}
        <div className="space-y-6">
          {/* Brand & Name */}
          <div>
            <Link href={`/brands/${product.brand.slug}`} className="text-sm font-bold hover:underline">
              {product.brand.nameKo ?? product.brand.name}
            </Link>
            <h1 className="text-xl font-medium mt-1">{product.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-0.5">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{product.reviewAvg.toFixed(1)}</span>
              </div>
              <span className="text-xs text-gray-400">
                리뷰 {product.reviewCount.toLocaleString()}
              </span>
            </div>
          </div>

          <Separator />

          {/* Price */}
          <div>
            <PriceDisplay basePrice={product.originalPrice} salePrice={product.salePrice} size="lg" />
            {product.salePrice && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs text-[var(--sale)] border-[var(--sale)]">
                  멤버스데이 쿠폰 적용가{" "}
                  {Math.floor(product.salePrice * 0.85).toLocaleString()}원
                </Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* Delivery info */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 text-sm">
              <Truck className="w-4 h-4 text-gray-400 shrink-0" />
              <span>무료배송 · 내일 도착 예정</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <RotateCcw className="w-4 h-4 text-gray-400 shrink-0" />
              <span>30일 이내 무료 반품</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="w-4 h-4 text-gray-400 shrink-0" />
              <span>무신사 정품 보증</span>
            </div>
          </div>

          <Separator />

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
          />
        </div>
      </div>

      {/* Product detail tabs */}
      <div className="mt-12">
        <Tabs defaultValue="detail">
          <TabsList className="w-full grid grid-cols-3 h-12">
            <TabsTrigger value="detail" className="text-sm font-medium">
              상품 상세
            </TabsTrigger>
            <TabsTrigger value="reviews" className="text-sm font-medium">
              리뷰 ({product.reviewCount.toLocaleString()})
            </TabsTrigger>
            <TabsTrigger value="qna" className="text-sm font-medium">
              문의 ({inquiryData.total})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="detail" className="py-8">
            <div className="prose max-w-none">
              <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400 text-sm">
                {product.description ? (
                  <p>{product.description}</p>
                ) : (
                  <p>상품 상세 이미지가 이곳에 표시됩니다.</p>
                )}
                <p className="mt-2">소재: 면 100% | 제조국: 대한민국</p>
                <p className="mt-2">세탁: 단독 손세탁 권장</p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="py-8">
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
          <TabsContent value="qna" className="py-8">
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
