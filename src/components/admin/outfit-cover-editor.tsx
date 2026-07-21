"use client";

import { useState, useTransition } from "react";
import { ImageUpload } from "@/components/shared/image-upload";
import { updateOutfitCoverAction } from "@/actions/outfit";
import { toast } from "sonner";

export function OutfitCoverEditor({
  outfitId,
  coverImage,
}: {
  outfitId: string;
  coverImage: string | null;
}) {
  const [cover, setCover] = useState<string[]>(coverImage ? [coverImage] : []);
  const [, startTransition] = useTransition();

  function handleChange(urls: string[]) {
    setCover(urls);
    startTransition(async () => {
      await updateOutfitCoverAction(outfitId, urls[0] ?? "");
      toast.success(urls[0] ? "커버 사진이 저장되었습니다." : "커버 사진을 비웠습니다.");
    });
  }

  return (
    <div>
      <ImageUpload category="outfit" maxFiles={1} value={cover} onChange={handleChange} />
      <p className="text-xs text-gray-400 mt-2">
        커버를 비우면 코디 상세에서 상품 콜라주로 자동 표시됩니다.
      </p>
    </div>
  );
}
