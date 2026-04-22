"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BannerData {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  imageAlignment?: "left" | "right"; // 이미지 내 모델 위치 (반대쪽에 텍스트)
  linkUrl?: string;
  bgColor?: string;
}

/**
 * 골프 그린 톤 + Outdoor 이미지 기반 다크 배너 4종
 * G/FORE 스타일 — 풀블리드 + 대형 타이포 + 숫자 인디케이터
 */
const DEFAULT_BANNERS: BannerData[] = [
  {
    id: "1",
    title: "2026 S/S\nGolf Edit",
    subtitle: "Premium Performance · Refined Silhouette",
    imageUrl: "/banners/hero-golf-polo.png",
    linkUrl: "/category/golf",
    bgColor: "#6B8E4E",
  },
  {
    id: "2",
    title: "The Art of\nKorean Fashion",
    subtitle: "A Curated Selection for the World",
    imageUrl: "",
    linkUrl: "/products?sort=newest",
    bgColor: "#0A0A0A",
  },
  {
    id: "3",
    title: "Outdoor\nCollection",
    subtitle: "Salomon · Wilson · The North Face",
    imageUrl: "",
    linkUrl: "/category/outdoor",
    bgColor: "#2D5E3F",
  },
  {
    id: "4",
    title: "Members Day",
    subtitle: "Exclusive Access · Up to 70% Off",
    imageUrl: "",
    linkUrl: "/membership",
    bgColor: "#0F1C2E",
  },
];

export function HeroBanner({
  banners: rawBanners = DEFAULT_BANNERS,
}: {
  banners?: BannerData[];
}) {
  const banners = rawBanners.length > 0 ? rawBanners : DEFAULT_BANNERS;
  const [current, setCurrent] = useState(0);

  // 자동 슬라이드 (6초)
  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % banners.length);
    }, 6000);
    return () => clearInterval(id);
  }, [banners.length]);

  const next = () => setCurrent((c) => (c + 1) % banners.length);
  const prev = () =>
    setCurrent((c) => (c - 1 + banners.length) % banners.length);

  const banner = banners[current];
  const isRight = banner.imageAlignment === "right";

  return (
    <div
      className="relative overflow-hidden"
      style={{ backgroundColor: banner.bgColor || "#0A0A0A" }}
    >
      {/* 풀블리드 배경 이미지 (있을 경우) */}
      {banner.imageUrl && (
        <>
          <Image
            src={banner.imageUrl}
            alt={banner.title}
            fill
            className={cn(
              "object-cover",
              isRight ? "object-right" : "object-left"
            )}
            priority
            sizes="100vw"
          />
          {/* 반대쪽 가독성 확보용 그라디언트 */}
          <div
            className={cn(
              "absolute inset-0 pointer-events-none",
              isRight
                ? "bg-gradient-to-r from-black/55 via-black/10 to-transparent"
                : "bg-gradient-to-l from-black/55 via-black/10 to-transparent"
            )}
          />
        </>
      )}

      <Link href={banner.linkUrl || "#"} className="block relative">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-24 md:py-32 lg:py-40 text-white">
          <div
            className={cn(
              "max-w-2xl",
              banner.imageUrl && (isRight ? "text-left" : "ml-auto text-right")
            )}
          >
            <p className="eyebrow text-white/60 mb-6">
              NKBUS · {String(current + 1).padStart(2, "0")} /{" "}
              {String(banners.length).padStart(2, "0")}
            </p>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-[-0.02em] leading-[0.95] whitespace-pre-line">
              {banner.title}
            </h2>
            {banner.subtitle && (
              <p className="text-sm md:text-base text-white/70 tracking-wide">
                {banner.subtitle}
              </p>
            )}
            <div className="mt-10 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-white pb-1 border-b border-white/60 group-hover:border-white transition-colors">
              Discover
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </Link>

      {/* Controls */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4 text-white" strokeWidth={1.5} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4 text-white" strokeWidth={1.5} />
          </button>

          {/* 숫자 인디케이터 (G/FORE 스타일 0123) */}
          <div className="absolute bottom-8 right-8 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/50 font-mono num">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  "transition-colors",
                  i === current ? "text-white" : "hover:text-white/80"
                )}
                aria-label={`Slide ${i + 1}`}
              >
                {String(i).padStart(2, "0")}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
