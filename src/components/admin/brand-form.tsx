"use client";

import { useActionState, useEffect, useRef } from "react";
import { createBrand } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export function BrandForm() {
  const [state, formAction, isPending] = useActionState(createBrand, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("브랜드가 추가되었습니다!");
      formRef.current?.reset();
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="w-4 h-4" /> 브랜드 추가
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm mb-1.5">브랜드명 (영문)</Label>
              <Input name="name" placeholder="NIKE" required />
            </div>
            <div>
              <Label className="text-sm mb-1.5">한글명</Label>
              <Input name="nameKo" placeholder="나이키" />
            </div>
            <div>
              <Label className="text-sm mb-1.5">Slug</Label>
              <Input name="slug" placeholder="nike" required />
            </div>
            <div>
              <Label className="text-sm mb-1.5">로고 URL</Label>
              <Input name="logoUrl" placeholder="https://..." />
            </div>
          </div>
          <div>
            <Label className="text-sm mb-1.5">설명</Label>
            <Input name="description" placeholder="브랜드 소개" />
          </div>
          <Button type="submit" disabled={isPending} className="bg-black hover:bg-gray-800 text-white">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            브랜드 추가
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
