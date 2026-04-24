"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  isMain: boolean;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
  isNew?: boolean;
}

export function ProductImageGallery({
  images,
  productName,
  isNew,
}: ProductImageGalleryProps) {
  const mainImage = images.find((img) => img.isMain) ?? images[0];
  const [selectedImage, setSelectedImage] = useState(mainImage);

  return (
    <div className="space-y-3 md:space-y-4">
      {/* 메인 이미지 — object-contain으로 상품 전체 노출, 잘림 방지 */}
      <div className="relative aspect-square md:aspect-[4/5] bg-[var(--stone)] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            selectedImage?.url ??
            "https://placehold.co/800x1000/F5F2EC/6B6B6B?text=No+Image"
          }
          alt={selectedImage?.alt ?? productName}
          className="absolute inset-0 w-full h-full object-contain transition-opacity duration-300 p-4 md:p-6"
          key={selectedImage?.id}
          loading="eager"
        />
        {isNew && (
          <span className="absolute top-3 left-3 md:top-4 md:left-4 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.15em] border border-[var(--ink)] bg-white text-[var(--ink)]">
            New
          </span>
        )}
      </div>

      {/* 썸네일 가로 스트립 */}
      {images.length > 1 && (
        <div className="flex gap-1.5 md:gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1 -mx-1 px-1">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedImage(img)}
              className={cn(
                "relative shrink-0 w-[68px] md:w-[88px] aspect-square bg-[var(--stone)] overflow-hidden snap-start transition-all",
                selectedImage?.id === img.id
                  ? "ring-1 ring-[var(--ink)] ring-offset-2 ring-offset-background"
                  : "opacity-55 hover:opacity-100"
              )}
              aria-label={`이미지 ${images.indexOf(img) + 1} 선택`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt ?? productName}
                className="absolute inset-0 w-full h-full object-contain p-1.5"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
