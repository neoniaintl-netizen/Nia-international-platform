"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createLookbookAction } from "@/actions/lookbook";
import { Plus } from "lucide-react";

export function LookbookForm() {
  const [state, formAction, isPending] = useActionState(
    createLookbookAction,
    null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="w-4 h-4" />새 룩북 등록
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input name="title" placeholder="제목 *" required />
            <Input
              name="slug"
              placeholder="slug (영문, 하이픈 가능) *"
              required
            />
          </div>
          <Input name="subtitle" placeholder="부제" />
          <Input
            name="coverImage"
            placeholder="커버 이미지 URL *"
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
            <Input name="brandSlug" placeholder="브랜드 slug (선택)" />
          </div>
          <Textarea
            name="description"
            placeholder="룩북 설명 (선택)"
            rows={3}
          />
          {state?.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}
          {(state as any)?.success && (
            <p className="text-sm text-green-600">룩북이 등록되었습니다.</p>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? "등록 중..." : "룩북 등록"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
