"use client";

import { useActionState, useEffect, useRef } from "react";
import { createBanner } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export function BannerForm() {
  const [state, formAction, isPending] = useActionState(createBanner, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("배너가 추가되었습니다!");
      formRef.current?.reset();
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="w-4 h-4" /> 배너 추가
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm mb-1.5">제목</Label>
              <Input name="title" placeholder="배너 제목" required />
            </div>
            <div>
              <Label className="text-sm mb-1.5">부제목</Label>
              <Input name="subtitle" placeholder="설명 텍스트" />
            </div>
            <div>
              <Label className="text-sm mb-1.5">이미지 URL</Label>
              <Input name="imageUrl" placeholder="https://..." required />
            </div>
            <div>
              <Label className="text-sm mb-1.5">링크 URL</Label>
              <Input name="linkUrl" placeholder="/products" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm mb-1.5">위치</Label>
              <select
                name="position"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="HOME_MAIN">홈 메인</option>
                <option value="HOME_SUB">홈 서브</option>
                <option value="CATEGORY">카테고리</option>
              </select>
            </div>
            <div>
              <Label className="text-sm mb-1.5">정렬순서</Label>
              <Input name="sortOrder" type="number" defaultValue={0} />
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox name="isActive" id="banner-active" defaultChecked />
                <label htmlFor="banner-active" className="text-sm">활성화</label>
              </div>
            </div>
          </div>
          <Button type="submit" disabled={isPending} className="bg-black hover:bg-gray-800 text-white">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            배너 추가
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
