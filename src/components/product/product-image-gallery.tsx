"use client";

import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-3">
      {/* 메인 이미지 */}
      <div className="relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden">
        <Image
          src={selectedImage?.url ?? "https://placehold.co/800x1067/c0c0c0/444?text=No+Image"}
          alt={selectedImage?.alt ?? productName}
          fill
          className="object-cover transition-opacity duration-200"
          priority
          key={selectedImage?.id}
        />
        {isNew && (
          <Badge className="absolute top-4 left-4 bg-black text-white">NEW</Badge>
        )}
      </div>

      {/* 썸네일 목록 */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedImage(img)}
              className={cn(
                "aspect-square bg-gray-100 rounded-lg overflow-hidden transition-all",
                selectedImage?.id === img.id
                  ? "ring-2 ring-black"
                  : "hover:ring-2 ring-gray-300"
              )}
            >
              <Image
                src={img.url}
                alt={img.alt ?? productName}
                width={200}
                height={200}
                className="object-cover w-full h-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
