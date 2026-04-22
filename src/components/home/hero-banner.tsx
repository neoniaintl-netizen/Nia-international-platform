"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BannerData {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  imageAlignment?: "left" | "right";
  linkUrl?: string;
  bgColor?: string;
}

const DEFAULT_BANNERS: BannerData[] = [
  {
    id: "1",
    title: "2026 S/S\nGolf Edit",
    subtitle: "Premium Performance · Refined Silhouette",
    imageUrl: "/banners/hero-golf-polo.png",
    imageAlignment: "left",
    linkUrl: "/category/golf",
    bgColor: "#6B8E4E",
  },
  {
    id: "2",
    title: "Women's\nGolf Edit",
    subtitle: "Powerful. Playful. Precise.",
    imageUrl: "/banners/hero-golf-women.png",
    imageAlignment: "right",
    linkUrl: "/category/women",
    bgColor: "#F4C2C2",
  },
];

const SLIDE_DURATION = 7000; // 7초 노출

export function HeroBanner({
  banners: rawBanners = DEFAULT_BANNERS,
}: {
  banners?: BannerData[];
}) {
  const banners = rawBanners.length > 0 ? rawBanners : DEFAULT_BANNERS;
  const [current, setCurrent] = useState(0);
  const [progressKey, setProgressKey] = useState(0); // progress bar 애니메이션 재시작용

  // 자동 슬라이드
  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % banners.length);
      setProgressKey((k) => k + 1);
    }, SLIDE_DURATION);
    return () => clearInterval(id);
  }, [banners.length]);

  const goTo = (i: number) => {
    setCurrent(i);
    setProgressKey((k) => k + 1);
  };
  const next = () => goTo((current + 1) % banners.length);
  const prev = () => goTo((current - 1 + banners.length) % banners.length);

  return (
    <div className="relative overflow-hidden bg-[#0A0A0A]">
      {/* 모든 슬라이드를 absolute로 겹쳐 렌더 — 크로스페이드 */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] lg:aspect-[21/8] max-h-[720px]">
        {banners.map((banner, i) => {
          const isActive = i === current;
          const isRight = banner.imageAlignment === "right";
          return (
            <div
              key={banner.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-[1400ms] ease-in-out",
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              )}
              style={{ backgroundColor: banner.bgColor || "#0A0A0A" }}
              aria-hidden={!isActive}
            >
              {/* 배경 이미지 + Ken Burns 느린 줌 */}
              {banner.imageUrl && (
                <>
                  <div
                    className={cn(
                      "absolute inset-0",
                      isActive && "animate-ken-burns"
                    )}
                    key={`${banner.id}-${isActive ? progressKey : "idle"}`}
                  >
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title}
                      fill
                      className={cn(
                        "object-cover",
                        isRight ? "object-right" : "object-left"
                      )}
                      priority={i === 0}
                      sizes="100vw"
                    />
                  </div>
                  {/* 반대쪽 어두운 그라디언트 (가독성) */}
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

              {/* 텍스트 */}
              <Link
                href={banner.linkUrl || "#"}
                className="absolute inset-0 flex items-center"
              >
                <div className="max-w-[1400px] w-full mx-auto px-4 lg:px-8 text-white">
                  <div
                    className={cn(
                      "max-w-2xl transition-all duration-[1400ms] ease-out",
                      isActive
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-6",
                      banner.imageUrl &&
                        (isRight ? "text-left" : "ml-auto text-right")
                    )}
                  >
                    <p className="eyebrow text-white/60 mb-5">
                      NKBUS · {String(i + 1).padStart(2, "0")} /{" "}
                      {String(banners.length).padStart(2, "0")}
                    </p>
                    <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-5 tracking-[-0.02em] leading-[0.95] whitespace-pre-line">
                      {banner.title}
                    </h2>
                    {banner.subtitle && (
                      <p className="text-sm md:text-base text-white/70 tracking-wide">
                        {banner.subtitle}
                      </p>
                    )}
                    <div
                      className={cn(
                        "mt-8 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-white pb-1 border-b border-white/60 hover:border-white transition-colors"
                      )}
                    >
                      Discover
                      <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* 좌/우 Controls */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/40 bg-black/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/10 hover:border-white transition-all z-30"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4 text-white" strokeWidth={1.5} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/40 bg-black/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/10 hover:border-white transition-all z-30"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4 text-white" strokeWidth={1.5} />
          </button>

          {/* 하단 중앙 페이지네이션 — progress bar + dot */}
          <div className="absolute bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
            {banners.map((_, i) => {
              const isActive = i === current;
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={cn(
                    "relative h-[2px] transition-all duration-500 overflow-hidden",
                    isActive ? "w-16 bg-white/20" : "w-10 bg-white/30 hover:bg-white/50"
                  )}
                  aria-label={`Go to slide ${i + 1}`}
                >
                  {isActive && (
                    <span
                      key={progressKey}
                      className="absolute inset-y-0 left-0 bg-white animate-progress-fill"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
