"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { HERO_BANNERS } from "@/lib/hero-banners";

export interface BannerData {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  imageAlignment?: "left" | "right";
  linkUrl?: string;
  cta?: string;
  bgColor?: string;
}

const SLIDE_DURATION = 7000; // 7초 노출

export function HeroBanner({
  banners: rawBanners = HERO_BANNERS,
}: {
  banners?: BannerData[];
}) {
  const banners = rawBanners.length > 0 ? rawBanners : HERO_BANNERS;
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
                        // top 정렬 — wide hero crop 시 인물 얼굴 잘림 방지
                        isRight ? "object-right-top" : "object-left-top"
                      )}
                      priority={i === 0}
                      sizes="100vw"
                    />
                  </div>
                  {/* 반대쪽 어두운 그라디언트 (가독성)
                      모바일에서 강화 (좁은 폭에서 텍스트가 인물 위에 올라감) */}
                  <div
                    className={cn(
                      "absolute inset-0 pointer-events-none",
                      isRight
                        ? "bg-gradient-to-r from-black/75 via-black/30 to-transparent md:from-black/55 md:via-black/10"
                        : "bg-gradient-to-l from-black/75 via-black/30 to-transparent md:from-black/55 md:via-black/10"
                    )}
                  />
                </>
              )}

              {/* 텍스트 */}
              <Link
                href={banner.linkUrl || "#"}
                className="absolute inset-0 flex items-center"
              >
                <div className="max-w-[1400px] w-full mx-auto px-5 sm:px-6 lg:px-8 text-white">
                  <div
                    className={cn(
                      "transition-all duration-[1400ms] ease-out",
                      // 모바일은 좁게 (인물 영역 침범 방지), 데스크톱은 max-w-2xl
                      "max-w-[52%] sm:max-w-[48%] md:max-w-2xl",
                      isActive
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-6",
                      banner.imageUrl &&
                        (isRight ? "text-left" : "ml-auto text-right")
                    )}
                  >
                    <p className="eyebrow text-white/60 mb-3 md:mb-5">
                      NOVAREN · {String(i + 1).padStart(2, "0")} /{" "}
                      {String(banners.length).padStart(2, "0")}
                    </p>
                    <h2 className="text-2xl sm:text-4xl md:text-7xl lg:text-8xl font-bold mb-3 md:mb-5 tracking-[-0.02em] leading-[0.95] whitespace-pre-line">
                      {banner.title}
                    </h2>
                    {banner.subtitle && (
                      <p className="text-xs sm:text-sm md:text-base text-white/70 tracking-wide">
                        {banner.subtitle}
                      </p>
                    )}
                    <div
                      className={cn(
                        "mt-5 md:mt-8 inline-flex items-center gap-2 md:gap-3 text-[10px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-[0.25em] text-white pb-1 border-b border-white/60 hover:border-white transition-colors"
                      )}
                    >
                      {banner.cta ?? "Discover"}
                      <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={1.5} />
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
          {/* Prev/Next — 모바일에서는 숨김 (텍스트 영역 침범 방지, dot 페이지네이션·자동 슬라이드로 충분) */}
          <button
            onClick={prev}
            className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/40 bg-black/10 backdrop-blur-sm items-center justify-center hover:bg-white/10 hover:border-white transition-all z-30"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4 text-white" strokeWidth={1.5} />
          </button>
          <button
            onClick={next}
            className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/40 bg-black/10 backdrop-blur-sm items-center justify-center hover:bg-white/10 hover:border-white transition-all z-30"
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
