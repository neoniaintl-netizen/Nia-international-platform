"use client";

import { useActionState, useEffect, useState } from "react";
import { createProduct, updateProduct } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, ImageIcon, Package } from "lucide-react";
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm mb-1.5">원가 (원) *</Label>
              <Input
                name="originalPrice"
                type="number"
                defaultValue={product?.originalPrice}
                placeholder="59000"
                min={0}
                required
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5">할인가 (원)</Label>
              <Input
                name="salePrice"
                type="number"
                defaultValue={product?.salePrice ?? ""}
                placeholder="할인 없으면 비워두세요"
                min={0}
              />
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addImage}
            className="mt-2"
          >
            <Plus className="w-3 h-3 mr-1" /> 이미지 추가
          </Button>
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
