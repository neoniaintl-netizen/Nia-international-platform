"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/shared/image-upload";
import { createOutfitAction } from "@/actions/outfit";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function OutfitCreateForm() {
  const [state, formAction, isPending] = useActionState(createOutfitAction, null);
  const [cover, setCover] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (state?.success && state.id) {
      toast.success("코디가 생성되었습니다. 아이템을 추가하세요.");
      router.push(`/admin/outfits/${state.id}`);
    }
    if (state?.error) toast.error(state.error);
  }, [state, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="w-4 h-4" /> 새 코디 만들기
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input name="title" placeholder="코디 제목 * (예: Anew Weekend Round)" required />
            <Input name="slug" placeholder="slug (영문·하이픈) *" required />
          </div>
          <Input name="subtitle" placeholder="부제 (선택)" />

          {/* 커버 사진 — 파일 업로드 */}
          <div>
            <p className="text-sm font-medium mb-1.5">커버 사진 (선택 — 없으면 상품 콜라주로 자동 표시)</p>
            <ImageUpload category="outfit" maxFiles={1} value={cover} onChange={setCover} />
            <input type="hidden" name="coverImage" value={cover[0] ?? ""} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input name="season" placeholder="시즌 (예: 2026 S/S)" />
            <select
              name="gender"
              className="h-9 px-3 border border-gray-300 rounded text-sm bg-white"
              defaultValue=""
            >
              <option value="">성별 (선택)</option>
              <option value="MEN">남성</option>
              <option value="WOMEN">여성</option>
              <option value="UNISEX">유니섹스</option>
            </select>
          </div>
          <Textarea name="description" placeholder="스타일링 노트 (선택)" rows={3} />

          {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

          <Button type="submit" disabled={isPending}>
            {isPending ? "생성 중..." : "코디 만들고 아이템 추가하기"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
