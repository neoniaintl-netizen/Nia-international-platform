"use client";

import Image from "next/image";
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
    <div className="space-y-4">
      {/* 메인 이미지 */}
      <div className="relative aspect-[4/5] bg-[var(--stone)] overflow-hidden">
        <Image
          src={
            selectedImage?.url ??
            "https://placehold.co/800x1000/F5F2EC/6B6B6B?text=No+Image"
          }
          alt={selectedImage?.alt ?? productName}
          fill
          className="object-cover transition-opacity duration-300"
          priority
          key={selectedImage?.id}
        />
        {isNew && (
          <span className="absolute top-4 left-4 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.15em] border border-[var(--ink)] bg-white text-[var(--ink)]">
            New
          </span>
        )}
      </div>

      {/* 썸네일 가로 스트립 */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedImage(img)}
              className={cn(
                "relative shrink-0 w-20 aspect-[4/5] bg-[var(--stone)] overflow-hidden transition-all",
                selectedImage?.id === img.id
                  ? "ring-1 ring-[var(--ink)] ring-offset-2 ring-offset-background"
                  : "opacity-60 hover:opacity-100"
              )}
            >
              <Image
                src={img.url}
                alt={img.alt ?? productName}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
