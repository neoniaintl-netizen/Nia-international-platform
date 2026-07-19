"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createProduct, updateProduct } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, ImageIcon, Package, Upload } from "lucide-react";
import { toast } from "sonner";

interface Brand {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  depth: number;
  parentId: string | null;
}

interface Variant {
  id?: string;
  color: string;
  size: string;
  sku: string;
  stock: number;
  isActive: boolean;
}

interface ImageItem {
  url: string;
  alt: string;
  isMain: boolean;
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brandId: string;
  categoryId: string;
  originalPrice: number;
  salePrice: number | null;
  status: string;
  isNew: boolean;
  isBest: boolean;
  images: ImageItem[];
  variants: Variant[];
}

interface ProductFormProps {
  brands: Brand[];
  categories: Category[];
  product?: ProductData; // 수정 모드일 때
}

export function ProductForm({ brands, categories, product }: ProductFormProps) {
  const isEdit = !!product;
  const action = isEdit ? updateProduct : createProduct;
  const [state, formAction, isPending] = useActionState(action, null);

  // ── 가격/할인율 (양방향 자동 계산) ──
  const [originalPrice, setOriginalPrice] = useState<number>(
    product?.originalPrice ?? 0
  );
  const [salePrice, setSalePrice] = useState<number | "">(
    product?.salePrice ?? ""
  );
  const initialRate =
    product?.salePrice != null && product?.originalPrice
      ? Math.round((1 - product.salePrice / product.originalPrice) * 100)
      : 0;
  const [discountRate, setDiscountRate] = useState<number | "">(
    initialRate > 0 ? initialRate : ""
  );

  const finalPrice =
    typeof salePrice === "number" && salePrice > 0 ? salePrice : originalPrice;

  const handleOriginalChange = (v: number) => {
    setOriginalPrice(v);
    if (typeof discountRate === "number" && discountRate > 0) {
      const sp = Math.round(v * (1 - discountRate / 100));
      setSalePrice(sp > 0 ? sp : "");
    }
  };

  const handleSaleChange = (raw: string) => {
    if (raw === "") {
      setSalePrice("");
      setDiscountRate("");
      return;
    }
    const v = parseInt(raw, 10);
    if (isNaN(v)) return;
    setSalePrice(v);
    if (originalPrice > 0 && v >= 0 && v < originalPrice) {
      setDiscountRate(Math.round((1 - v / originalPrice) * 100));
    } else {
      setDiscountRate("");
    }
  };

  const handleRateChange = (raw: string) => {
    if (raw === "") {
      setDiscountRate("");
      setSalePrice("");
      return;
    }
    const r = parseInt(raw, 10);
    if (isNaN(r) || r < 0 || r > 99) return;
    setDiscountRate(r);
    if (originalPrice > 0 && r > 0) {
      setSalePrice(Math.round(originalPrice * (1 - r / 100)));
    } else if (r === 0) {
      setSalePrice("");
    }
  };

  // 이미지 목록 관리
  const [images, setImages] = useState<ImageItem[]>(
    product?.images ?? [{ url: "", alt: "", isMain: true }]
  );

  // 변형(사이즈/컬러) 관리
  const [variants, setVariants] = useState<Variant[]>(
    product?.variants ?? [
      { color: "", size: "", sku: "", stock: 100, isActive: true },
    ]
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "상품이 수정되었습니다." : "상품이 등록되었습니다.");
      // 신규 등록 성공 시 폼 전체 리셋 — 비제어 필드는 폼 액션이 비우지만
      // 제어 상태(가격/이미지/옵션)는 남아서 다음 상품에 섞이는 실수를 유발함
      if (!isEdit) {
        setOriginalPrice(0);
        setSalePrice("");
        setDiscountRate("");
        setImages([{ url: "", alt: "", isMain: true }]);
        setVariants([{ color: "", size: "", sku: "", stock: 100, isActive: true }]);
      }
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state, isEdit]);

  // 카테고리를 depth별로 정렬 표시
  const sortedCategories = [...categories].sort(
    (a, b) => a.depth - b.depth || a.name.localeCompare(b.name)
  );

  const addImage = () =>
    setImages([...images, { url: "", alt: "", isMain: false }]);
  const removeImage = (idx: number) =>
    setImages(images.filter((_, i) => i !== idx));
  const setMainImage = (idx: number) =>
    setImages(images.map((img, i) => ({ ...img, isMain: i === idx })));

  // ── 이미지 파일 업로드 (/api/upload 재사용) — URL 붙여넣기 대신 파일 선택 ──
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("files", f));
      formData.append("category", "general");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // 업로드된 URL을 이미지 행에 채움 — 빈 행부터 채우고 나머지는 새 행 추가
      setImages((prev) => {
        const next = [...prev];
        const urls: string[] = data.urls;
        for (const url of urls) {
          const empty = next.findIndex((img) => !img.url);
          if (empty >= 0) next[empty] = { ...next[empty], url };
          else next.push({ url, alt: "", isMain: false });
        }
        if (!next.some((img) => img.isMain) && next[0])
          next[0] = { ...next[0], isMain: true };
        return next;
      });
      toast.success(`이미지 ${data.urls.length}장 업로드 완료`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addVariant = () =>
    setVariants([
      ...variants,
      { color: "", size: "", sku: "", stock: 100, isActive: true },
    ]);
  const removeVariant = (idx: number) =>
    setVariants(variants.filter((_, i) => i !== idx));

  return (
    <form action={formAction} className="space-y-6">
      {/* 수정 모드일 때 ID 전달 */}
      {isEdit && <input type="hidden" name="id" value={product!.id} />}

      {/* ── 기본 정보 ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="text-sm mb-1.5">상품명 *</Label>
              <Input
                name="name"
                defaultValue={product?.name}
                placeholder="상품명을 입력하세요"
                required
              />
            </div>

            <div>
              <Label className="text-sm mb-1.5">브랜드 *</Label>
              <select
                name="brandId"
                defaultValue={product?.brandId}
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">브랜드 선택</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">
                목록에 없으면{" "}
                <a
                  href="/admin/brands"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-black"
                >
                  브랜드 생성
                </a>
                {" "}후 이 페이지를 새로고침하세요
              </p>
            </div>

            <div>
              <Label className="text-sm mb-1.5">카테고리 *</Label>
              <select
                name="categoryId"
                defaultValue={product?.categoryId}
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">카테고리 선택</option>
                {sortedCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {"─".repeat(c.depth)} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-sm mb-1.5">상품 설명</Label>
            <textarea
              name="description"
              defaultValue={product?.description ?? ""}
              placeholder="상품 설명을 입력하세요"
              rows={4}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── 가격/상태 ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">가격 및 상태</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <Label className="text-sm mb-1.5">원가 (원) *</Label>
              <Input
                name="originalPrice"
                type="number"
                value={originalPrice}
                onChange={(e) => handleOriginalChange(parseInt(e.target.value) || 0)}
                placeholder="59000"
                min={0}
                required
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5">할인율 (%)</Label>
              <Input
                type="number"
                value={discountRate}
                onChange={(e) => handleRateChange(e.target.value)}
                placeholder="0"
                min={0}
                max={99}
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5">할인가 (원)</Label>
              <Input
                name="salePrice"
                type="number"
                value={salePrice}
                onChange={(e) => handleSaleChange(e.target.value)}
                placeholder="자동 계산"
                min={0}
              />
              {originalPrice > 0 && (
                <p className="text-[11px] text-gray-500 mt-1">
                  최종가:{" "}
                  <span className="font-bold text-black">
                    {finalPrice.toLocaleString()}원
                  </span>
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm mb-1.5">상태</Label>
              <select
                name="status"
                defaultValue={product?.status ?? "DRAFT"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="DRAFT">검수대기</option>
                <option value="ACTIVE">판매중</option>
                <option value="HIDDEN">숨김</option>
                <option value="ARCHIVED">보관</option>
              </select>
            </div>
            <div className="flex items-end gap-4 pb-1">
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  name="isNew"
                  defaultChecked={product?.isNew}
                  className="rounded"
                />
                신상품
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  name="isBest"
                  defaultChecked={product?.isBest}
                  className="rounded"
                />
                베스트
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 이미지 ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> 상품 이미지
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {images.map((img, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs shrink-0 w-16">
                <input
                  type="radio"
                  name="mainImageIdx"
                  value={idx}
                  checked={img.isMain}
                  onChange={() => setMainImage(idx)}
                />
                대표
              </label>
              <a
                href={img.url || "#"}
                target={img.url ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="w-14 h-14 shrink-0 border rounded overflow-hidden bg-gray-50 flex items-center justify-center relative group"
                onClick={(e) => {
                  if (!img.url) e.preventDefault();
                }}
                title={img.url ? "원본 이미지 새 탭으로 보기" : "URL을 입력하세요"}
              >
                {img.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.url}
                    alt={img.alt || "preview"}
                    className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                    onError={(e) => {
                      const t = e.currentTarget;
                      t.style.display = "none";
                      const fallback = t.parentElement?.querySelector(
                        "[data-fallback]"
                      ) as HTMLElement | null;
                      if (fallback) fallback.style.display = "flex";
                    }}
                    onLoad={(e) => {
                      const t = e.currentTarget;
                      t.style.display = "block";
                      const fallback = t.parentElement?.querySelector(
                        "[data-fallback]"
                      ) as HTMLElement | null;
                      if (fallback) fallback.style.display = "none";
                    }}
                  />
                ) : null}
                <span
                  data-fallback
                  className="absolute inset-0 items-center justify-center text-[10px] text-gray-400"
                  style={{ display: img.url ? "none" : "flex" }}
                >
                  {img.url ? "오류" : "없음"}
                </span>
              </a>
              <Input
                name={`imageUrl_${idx}`}
                value={img.url}
                onChange={(e) => {
                  const next = [...images];
                  next[idx] = { ...next[idx], url: e.target.value };
                  setImages(next);
                }}
                placeholder="이미지 URL"
                className="flex-1"
              />
              <Input
                name={`imageAlt_${idx}`}
                value={img.alt}
                onChange={(e) => {
                  const next = [...images];
                  next[idx] = { ...next[idx], alt: e.target.value };
                  setImages(next);
                }}
                placeholder="ALT 텍스트"
                className="w-40"
              />
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <input type="hidden" name="imageCount" value={images.length} />
          <div className="flex items-center gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addImage}
            >
              <Plus className="w-3 h-3 mr-1" /> 이미지 추가
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Upload className="w-3 h-3 mr-1" />
              )}
              파일 업로드
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <span className="text-[11px] text-gray-400">
              파일 선택 시 자동 업로드 · 5MB 이하 JPG/PNG/WebP
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── 옵션(변형) ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4" /> 옵션 (사이즈/컬러)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 헤더 */}
          <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 font-medium px-1">
            <div className="col-span-3">컬러</div>
            <div className="col-span-3">사이즈</div>
            <div className="col-span-3">SKU</div>
            <div className="col-span-2">재고</div>
            <div className="col-span-1"></div>
          </div>

          {variants.map((v, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-3">
                <Input
                  name={`variantColor_${idx}`}
                  value={v.color}
                  onChange={(e) => {
                    const next = [...variants];
                    next[idx] = { ...next[idx], color: e.target.value };
                    setVariants(next);
                  }}
                  placeholder="블랙"
                  className="h-8 text-sm"
                />
              </div>
              <div className="col-span-3">
                <Input
                  name={`variantSize_${idx}`}
                  value={v.size}
                  onChange={(e) => {
                    const next = [...variants];
                    next[idx] = { ...next[idx], size: e.target.value };
                    setVariants(next);
                  }}
                  placeholder="M"
                  className="h-8 text-sm"
                />
              </div>
              <div className="col-span-3">
                <Input
                  name={`variantSku_${idx}`}
                  value={v.sku}
                  onChange={(e) => {
                    const next = [...variants];
                    next[idx] = { ...next[idx], sku: e.target.value };
                    setVariants(next);
                  }}
                  placeholder="자동생성"
                  className="h-8 text-sm"
                />
              </div>
              <div className="col-span-2">
                <Input
                  name={`variantStock_${idx}`}
                  type="number"
                  value={v.stock}
                  onChange={(e) => {
                    const next = [...variants];
                    next[idx] = {
                      ...next[idx],
                      stock: parseInt(e.target.value) || 0,
                    };
                    setVariants(next);
                  }}
                  min={0}
                  className="h-8 text-sm"
                />
              </div>
              <div className="col-span-1 flex justify-center">
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(idx)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
          <input type="hidden" name="variantCount" value={variants.length} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addVariant}
            className="mt-2"
          >
            <Plus className="w-3 h-3 mr-1" /> 옵션 추가
          </Button>
        </CardContent>
      </Card>

      {/* ── 제출 ── */}
      {state?.error && (
        <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-black hover:bg-gray-800 text-white px-8"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {isEdit ? "수정 중..." : "등록 중..."}
            </>
          ) : isEdit ? (
            "상품 수정"
          ) : (
            "상품 등록"
          )}
        </Button>
        <a
          href="/admin/products"
          className="text-sm text-gray-500 hover:text-black"
        >
          취소
        </a>
      </div>
    </form>
  );
}
