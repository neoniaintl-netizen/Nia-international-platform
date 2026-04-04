"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCoupon } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export function CouponForm() {
  const [state, formAction, isPending] = useActionState(createCoupon, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("쿠폰이 생성되었습니다!");
      formRef.current?.reset();
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="w-4 h-4" /> 쿠폰 생성
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm mb-1.5">쿠폰 코드</Label>
              <Input name="code" placeholder="WELCOME2024" required />
            </div>
            <div>
              <Label className="text-sm mb-1.5">쿠폰명</Label>
              <Input name="name" placeholder="신규 가입 쿠폰" required />
            </div>
            <div>
              <Label className="text-sm mb-1.5">할인 타입</Label>
              <select
                name="discountType"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="PERCENTAGE">퍼센트 (%)</option>
                <option value="FIXED_AMOUNT">정액 (원)</option>
              </select>
            </div>
            <div>
              <Label className="text-sm mb-1.5">할인값</Label>
              <Input name="discountValue" type="number" placeholder="10" required />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm mb-1.5">최소 주문금액</Label>
              <Input name="minOrderAmount" type="number" placeholder="30000" />
            </div>
            <div>
              <Label className="text-sm mb-1.5">최대 할인금액</Label>
              <Input name="maxDiscount" type="number" placeholder="5000" />
            </div>
            <div>
              <Label className="text-sm mb-1.5">시작일</Label>
              <Input name="startsAt" type="date" required />
            </div>
            <div>
              <Label className="text-sm mb-1.5">종료일</Label>
              <Input name="expiresAt" type="date" required />
            </div>
          </div>
          <div>
            <Label className="text-sm mb-1.5">설명</Label>
            <Input name="description" placeholder="쿠폰 설명 (선택)" />
          </div>
          <Button type="submit" disabled={isPending} className="bg-black hover:bg-gray-800 text-white">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            쿠폰 생성
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
