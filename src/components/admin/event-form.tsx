"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createEventAction } from "@/actions/event";
import { Plus } from "lucide-react";

export function EventForm() {
  const [state, formAction, isPending] = useActionState(
    createEventAction,
    null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="w-4 h-4" />새 기획전 등록
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
          <Input name="bannerImage" placeholder="배너 이미지 URL (선택)" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">시작일</label>
              <Input type="date" name="startsAt" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">종료일</label>
              <Input type="date" name="endsAt" />
            </div>
          </div>
          <Textarea
            name="description"
            placeholder="기획전 설명 (선택)"
            rows={3}
          />
          {state?.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}
          {(state as any)?.success && (
            <p className="text-sm text-green-600">기획전이 등록되었습니다.</p>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? "등록 중..." : "기획전 등록"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
