import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product/product-card";
import { toProductCard } from "@/lib/mappers";
import { Separator } from "@/components/ui/separator";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const lb = await prisma.lookbook.findUnique({
    where: { slug },
    select: { title: true, subtitle: true },
  });
  return {
    title: lb ? `${lb.title} | NOVAREN 룩북` : "룩북 | NOVAREN",
    description: lb?.subtitle ?? "NOVAREN 룩북",
  };
}

export default async function LookbookDetailPage({ params }: Props) {
  const { slug } = await params;
  const lb = await prisma.lookbook.findUnique({
    where: { slug },
    include: {
      brand: { select: { name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" } },
      products: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: {
            include: {
              brand: { select: { name: true, slug: true } },
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!lb || !lb.isPublished) return notFound();

  void prisma.lookbook.update({
    where: { id: lb.id },
    data: { viewCount: { increment: 1 } },
  });

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="px-4 lg:px-6 pt-6">
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:text-black">홈</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/lookbook" className="hover:text-black">룩북</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-black font-medium line-clamp-1">{lb.title}</span>
        </div>
      </div>

      {/* Cover */}
      <div className="relative aspect-[3/4] md:aspect-[16/9] bg-gray-100">
        <Image
          src={lb.coverImage}
          alt={lb.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="px-4 lg:px-6 py-8 lg:py-12 max-w-3xl mx-auto text-center">
        {lb.season && (
          <p className="text-xs font-bold text-gray-400 mb-2">{lb.season}</p>
        )}
        <h1 className="text-2xl lg:text-4xl font-black mb-3">{lb.title}</h1>
        {lb.subtitle && (
          <p className="text-sm lg:text-base text-gray-600 mb-6">
            {lb.subtitle}
          </p>
        )}
        {lb.description && (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {lb.description}
          </p>
        )}
      </div>

      {/* Additional images */}
      {lb.images.length > 0 && (
        <div className="space-y-4 max-w-3xl mx-auto px-4 lg:px-6 mb-12">
          {lb.images.map((img) => (
            <div
              key={img.id}
              className="relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden"
            >
              <Image
                src={img.url}
                alt={img.caption ?? lb.title}
                fill
                className="object-cover"
              />
              {img.caption && (
                <p className="absolute bottom-4 left-4 right-4 text-white text-xs bg-black/50 backdrop-blur-sm p-2 rounded">
                  {img.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Shop the look */}
      {lb.products.length > 0 && (
        <div className="px-4 lg:px-6 py-8 max-w-[1280px] mx-auto">
          <Separator className="mb-8" />
          <h2 className="text-xl font-bold mb-2">SHOP THE LOOK</h2>
          <p className="text-xs text-gray-500 mb-6">
            이 룩북에 등장한 상품을 바로 구매하세요
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-6">
            {lb.products.map((lp) => (
              <ProductCard
                key={lp.productId}
                product={toProductCard(lp.product)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
