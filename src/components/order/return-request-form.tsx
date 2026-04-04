"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RotateCcw } from "lucide-react";
import { requestReturn } from "@/actions/return";

const RETURN_REASONS = [
  "단순 변심",
  "사이즈 불일치",
  "상품 불량/파손",
  "배송 오류 (잘못된 상품)",
  "상품 설명과 다름",
  "기타",
];

export function ReturnRequestForm({ orderId }: { orderId: string }) {
  const [state, formAction, isPending] = useActionState(requestReturn, null);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="text-xs gap-1" />}>
        <RotateCcw className="w-3.5 h-3.5" />
        반품 신청
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>반품 신청</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="orderId" value={orderId} />
          <div>
            <Label className="text-sm mb-2 block">반품 사유</Label>
            <div className="space-y-2">
              {RETURN_REASONS.map((reason) => (
                <label key={reason} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="reason" value={reason} required className="accent-black" />
                  <span className="text-sm">{reason}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="description" className="text-sm mb-1.5">상세 사유 (선택)</Label>
            <Textarea id="description" name="description" placeholder="추가 설명을 입력해주세요" rows={3} />
          </div>
          {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
          {state?.success && <p className="text-sm text-green-600">반품 요청이 접수되었습니다.</p>}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "처리중..." : "반품 신청하기"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
