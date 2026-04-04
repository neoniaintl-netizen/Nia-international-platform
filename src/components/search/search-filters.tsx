"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SlidersHorizontal, X } from "lucide-react";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "FREE"];
const COLORS = ["블랙", "화이트", "네이비", "그레이", "베이지", "브라운", "카키", "레드", "블루", "그린"];

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    searchParams.get("sizes")?.split(",").filter(Boolean) || []
  );
  const [selectedColors, setSelectedColors] = useState<string[]>(
    searchParams.get("colors")?.split(",").filter(Boolean) || []
  );

  function toggleSize(size: string) {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }

  function toggleColor(color: string) {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  }

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");
    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");
    if (selectedSizes.length > 0) params.set("sizes", selectedSizes.join(","));
    else params.delete("sizes");
    if (selectedColors.length > 0) params.set("colors", selectedColors.join(","));
    else params.delete("colors");
    router.push(`/search?${params.toString()}`);
  }

  function resetFilters() {
    setMinPrice("");
    setMaxPrice("");
    setSelectedSizes([]);
    setSelectedColors([]);
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    router.push(`/search?${params.toString()}`);
  }

  const hasFilters = minPrice || maxPrice || selectedSizes.length > 0 || selectedColors.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          필터
        </h3>
        {hasFilters && (
          <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-black flex items-center gap-1">
            <X className="w-3 h-3" />
            초기화
          </button>
        )}
      </div>

      {/* Price Range */}
      <div>
        <Label className="text-xs font-medium text-gray-600 mb-2 block">가격대</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="최소"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="h-8 text-xs"
          />
          <span className="text-gray-400 text-xs">~</span>
          <Input
            type="number"
            placeholder="최대"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Sizes */}
      <div>
        <Label className="text-xs font-medium text-gray-600 mb-2 block">사이즈</Label>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <label key={size} className="flex items-center gap-1.5 cursor-pointer">
              <Checkbox
                checked={selectedSizes.includes(size)}
                onCheckedChange={() => toggleSize(size)}
              />
              <span className="text-xs">{size}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <Label className="text-xs font-medium text-gray-600 mb-2 block">컬러</Label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((color) => (
            <label key={color} className="flex items-center gap-1.5 cursor-pointer">
              <Checkbox
                checked={selectedColors.includes(color)}
                onCheckedChange={() => toggleColor(color)}
              />
              <span className="text-xs">{color}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Apply button */}
      <Button onClick={applyFilters} className="w-full h-9 bg-black hover:bg-gray-800 text-white text-sm">
        적용
      </Button>
    </div>
  );
}
