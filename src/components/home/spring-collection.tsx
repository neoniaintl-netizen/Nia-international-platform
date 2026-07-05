"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductCardData } from "@/components/product/product-card";
import { PriceDisplay } from "@/components/shared/price-display";
import { thumbUrl } from "@/lib/image-url";

interface SpringCollectionProps {
  products: ProductCardData[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  linkHref?: string;
  linkLabel?: string;
}

const SLIDE_INTERVAL = 4000;

export function SpringCollection({
  products,
  eyebrow = "Summer Edit 2026",
  title = "여름과 어울리는 코디",
  subtitle = "가볍고 시원한 여름을 위한 큐레이션",
  linkHref = "/products?sort=newest",
  linkLabel = "View All",
}: SpringCollectionProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function updateItems() {
      if (window.innerWidth < 640) setItemsPerPage(2);
      else if (window.innerWidth < 1024) setItemsPerPage(3);
      else setItemsPerPage(4);
    }
    updateItems();
    window.addEventListener("resize", updateItems);
    return () => window.removeEventListener("resize", updateItems);
  }, []);

  const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage));

  useEffect(() => {
    if (isPaused || totalPages <= 1) return;
    const id = setInterval(() => {
      setPageIndex((p) => (p + 1) % totalPages);
    }, SLIDE_INTERVAL);
    return () => clearInterval(id);
  }, [isPaused, totalPages]);

  useEffect(() => {
    if (pageIndex >= totalPages) setPageIndex(0);
  }, [totalPages, pageIndex]);

  if (products.length === 0) return null;

  const goPrev = () =>
    setPageIndex((p) => (p - 1 + totalPages) % totalPages);
  const goNext = () => setPageIndex((p) => (p + 1) % totalPages);

  return (
    <section className="py-10 lg:py-16 bg-gradient-to-b from-[#FAF7F2] to-white">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="flex items-end justify-between mb-6 lg:mb-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A8B5C] font-medium mb-2">
              {eyebrow}
            </p>
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-sm text-[var(--ink)]/60">{subtitle}</p>
            )}
          </div>
          <Link
            href={linkHref}
            className="hidden md:inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] pb-1 border-b border-[var(--ink)]/40 hover:border-[var(--ink)] transition-colors"
          >
            {linkLabel}
          </Link>
        </div>

        <div
          ref={containerRef}
          className="relative overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{
              transform: `translateX(-${pageIndex * 100}%)`,
            }}
          >
            {Array.from({ length: totalPages }).map((_, page) => {
              const slice = products.slice(
                page * itemsPerPage,
                page * itemsPerPage + itemsPerPage,
              );
              return (
                <div
                  key={page}
                  className="grid shrink-0 w-full gap-x-4 gap-y-6"
                  style={{
                    gridTemplateColumns: `repeat(${itemsPerPage}, minmax(0, 1fr))`,
                  }}
                >
                  {slice.map((product) => (
                    <SpringCard key={product.id} product={product} />
                  ))}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous"
                className="absolute left-2 top-[40%] -translate-y-1/2 z-10 w-9 h-9 lg:w-11 lg:h-11 bg-white/90 hover:bg-white border border-[var(--ink)]/10 shadow-sm flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Next"
                className="absolute right-2 top-[40%] -translate-y-1/2 z-10 w-9 h-9 lg:w-11 lg:h-11 bg-white/90 hover:bg-white border border-[var(--ink)]/10 shadow-sm flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={1.5} />
              </button>
            </>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPageIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1 transition-all duration-300 ${
                  i === pageIndex
                    ? "w-8 bg-[var(--ink)]"
                    : "w-2 bg-[var(--ink)]/20 hover:bg-[var(--ink)]/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SpringCard({ product }: { product: ProductCardData }) {
  const imgSrc = thumbUrl(product.imageUrl, 600);
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--paper)] mb-3">
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.03]"
        />
        {product.isNew && (
          <span className="absolute top-3 left-3 px-2 py-0.5 bg-white/90 text-[10px] font-medium uppercase tracking-[0.15em]">
            NEW
          </span>
        )}
      </div>
      <p className="text-[11px] uppercase tracking-[0.1em] text-[var(--ink)]/60 mb-1">
        {product.brandName}
      </p>
      <p className="text-sm font-medium line-clamp-1 mb-1.5">{product.name}</p>
      <PriceDisplay
        basePrice={product.basePrice}
        salePrice={product.salePrice}
      />
    </Link>
  );
}
