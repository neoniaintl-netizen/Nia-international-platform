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
    title: "MEMBERS DAY",
    subtitle: "회원 한정 최대 70% OFF",
    imageUrl: "",
    linkUrl: "/products?sort=sale",
    bgColor: "#000000",
  },
  {
    id: "2",
    title: "2025 S/S 신상품",
    subtitle: "트렌디한 봄 컬렉션을 만나보세요",
    imageUrl: "",
    linkUrl: "/products?tag=ss2025",
    bgColor: "#1a1a2e",
  },
  {
    id: "3",
    title: "무신사 스탠다드",
    subtitle: "합리적인 가격의 에센셜 아이템",
    imageUrl: "",
    linkUrl: "/brands/musinsa-standard",
    bgColor: "#16213e",
  },
];

export function HeroBanner({ banners = DEMO_BANNERS }: { banners?: BannerData[] }) {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((c) => (c + 1) % banners.length);
  const prev = () => setCurrent((c) => (c - 1 + banners.length) % banners.length);

  const banner = banners[current];

  return (
    <div className="relative overflow-hidden" style={{ backgroundColor: banner.bgColor || "#000" }}>
      <Link href={banner.linkUrl || "#"} className="block">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-12 md:py-20 lg:py-24 text-white">
          <div className="max-w-lg">
            <h2 className="text-3xl md:text-5xl font-black mb-3 tracking-tight">
              {banner.title}
            </h2>
            {banner.subtitle && (
              <p className="text-sm md:text-lg text-white/70">{banner.subtitle}</p>
            )}
          </div>
        </div>
      </Link>

      {/* Controls */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === current ? "bg-white w-5" : "bg-white/40"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
