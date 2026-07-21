"use client";

import { useCallback, useRef, useState } from "react";
import { Camera, X, Loader2, ImagePlus } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface ImageUploadProps {
  category: string;
  maxFiles?: number;
  value?: string[];
  onChange: (urls: string[]) => void;
  /** 프로필용 원형 단일 업로드 */
  avatar?: boolean;
}

export function ImageUpload({
  category,
  maxFiles = 5,
  value = [],
  onChange,
  avatar = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const t = useTranslations("Common");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;

      // 최대 파일 수 체크
      const remaining = maxFiles - value.length;
      if (remaining <= 0) return;

      const filesToUpload = Array.from(files).slice(0, remaining);

      setUploading(true);
      try {
        const formData = new FormData();
        filesToUpload.forEach((f) => formData.append("files", f));
        formData.append("category", category);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        if (avatar) {
          // 프로필: 단일 이미지 교체
          onChange(data.urls.slice(0, 1));
        } else {
          // 리뷰: 기존에 추가
          onChange([...value, ...data.urls]);
        }
      } catch (err: any) {
        alert(err.message || t("uploadFailed"));
      } finally {
        setUploading(false);
        // input 초기화 (같은 파일 재선택 가능)
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [category, maxFiles, value, onChange, avatar]
  );

  const removeImage = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange]
  );

  // ─── 프로필 아바타 모드 ───
  if (avatar) {
    const currentUrl = value[0];
    return (
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-200">
            {currentUrl ? (
              <Image
                src={currentUrl}
                alt={t("profile")}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Camera className="w-8 h-8" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
        <div className="text-sm text-gray-500">
          <p>{t("changeProfilePhoto")}</p>
          <p className="text-xs text-gray-400">{t("imageFormatNote")}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleUpload}
          className="hidden"
        />
      </div>
    );
  }

  // ─── 리뷰 다중 이미지 모드 ───
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((url, i) => (
          <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden border group">
            <Image
              src={url}
              alt={`이미지 ${i + 1}`}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}

        {value.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="w-5 h-5" />
                <span className="text-[10px]">
                  {value.length}/{maxFiles}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={handleUpload}
        className="hidden"
      />

      <p className="text-xs text-gray-400">
        {t("maxFilesNote", { n: maxFiles })}
      </p>
    </div>
  );
}
