import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronRight, Clock } from "lucide-react";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product/product-card";
import { toProductCard } from "@/lib/mappers";
import { Separator } from "@/components/ui/separator";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    select: { title: true, subtitle: true },
  });
  return {
    title: event ? `${event.title} | NOVAREN 기획전` : "기획전 | NOVAREN",
    description: event?.subtitle ?? "NOVAREN 기획전",
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
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

  if (!event || !event.isPublished) return notFound();
  const t = await getTranslations("Shop");

  // 조회수 증가 (비동기)
  void prisma.event.update({
    where: { id: event.id },
    data: { viewCount: { increment: 1 } },
  });

  const now = new Date();
  const isEnded = event.endsAt && event.endsAt < now;
  const dday =
    event.endsAt && !isEnded
      ? Math.max(
          1,
          Math.ceil((event.endsAt.getTime() - now.getTime()) / 86_400_000)
        )
      : null;

  return (
    <div className="max-w-[1280px] mx-auto">
      {/* Breadcrumb */}
      <div className="px-4 lg:px-6 pt-6">
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:text-black">{t("home")}</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/events" className="hover:text-black">{t("events")}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-black font-medium line-clamp-1">{event.title}</span>
        </div>
      </div>

      {/* Hero */}
      <div className="relative aspect-[16/9] lg:aspect-[21/9] bg-gray-100">
        <Image
          src={event.bannerImage ?? event.coverImage}
          alt={event.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10 text-white">
          <div className="max-w-[1280px] mx-auto">
            {dday && (
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold mb-3">
                <Clock className="w-3 h-3" />
                D-{dday}
              </div>
            )}
            {isEnded && (
              <div className="inline-block bg-gray-800 px-3 py-1.5 rounded-full text-xs font-bold mb-3">
                {t("eventEnded")}
              </div>
            )}
            <h1 className="text-2xl lg:text-4xl font-black mb-2">
              {event.title}
            </h1>
            {event.subtitle && (
              <p className="text-sm lg:text-base opacity-90">
                {event.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-8 lg:py-12">
        {event.description && (
          <div className="max-w-2xl mx-auto text-center mb-10">
            <p className="text-sm lg:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}

        <Separator className="mb-8" />

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            {t("eventProductsN", { n: event.products.length })}
          </p>
        </div>

        {event.products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>{t("productPreparing")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-6">
            {event.products.map((ep) => (
              <ProductCard
                key={ep.productId}
                product={toProductCard(ep.product)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
