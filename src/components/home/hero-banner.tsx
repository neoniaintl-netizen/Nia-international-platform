"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BannerData {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  bgColor?: string;
}

const DEMO_BANNERS: BannerData[] = [
  {
    id: "1",
    title: "The Art of Korean Fashion",
    subtitle: "A Curated Selection for the Modern World",
    imageUrl: "",
    linkUrl: "#",
    bgColor: "#0A0A0A",
  },
  {
    id: "2",
    title: "2026 S/S Golf Edit",
    subtitle: "Premium Performance · Refined Silhouette",
    imageUrl: "",
    linkUrl: "/category/golf",
    bgColor: "#0F1C2E",
  },
  {
    id: "3",
    title: "Members Day",
    subtitle: "Exclusive Access · Up to 70% Off",
    imageUrl: "",
    linkUrl: "/membership",
    bgColor: "#1A1A1A",
  },
];

export function HeroBanner({
  banners: rawBanners = DEMO_BANNERS,
}: {
  banners?: BannerData[];
}) {
  const banners = rawBanners.length > 0 ? rawBanners : DEMO_BANNERS;
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((c) => (c + 1) % banners.length);
  const prev = () =>
    setCurrent((c) => (c - 1 + banners.length) % banners.length);

  const banner = banners[current];

  return (
    <div
      className="relative overflow-hidden"
      style={{ backgroundColor: banner.bgColor || "#0A0A0A" }}
    >
      <Link href={banner.linkUrl || "#"} className="block">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-16 md:py-24 lg:py-28 text-white">
          <div className="max-w-xl">
            <p className="eyebrow text-white/60 mb-4">
              NKBUS · {String(current + 1).padStart(2, "0")}
            </p>
            <h2 className="text-4xl md:text-6xl font-normal mb-5 tracking-[-0.02em] leading-[1.05]">
              {banner.title}
            </h2>
            {banner.subtitle && (
              <p className="text-[13px] md:text-sm text-white/70 tracking-wide">
                {banner.subtitle}
              </p>
            )}
            <div className="mt-8 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-white/80 pb-1 border-b border-white/40 group-hover:border-white">
              Discover
              <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </Link>

      {/* Controls */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4 text-white" strokeWidth={1.5} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4 text-white" strokeWidth={1.5} />
          </button>

          {/* Line indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  "h-[1px] transition-all",
                  i === current ? "w-10 bg-white" : "w-6 bg-white/40"
                )}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
