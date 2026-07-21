"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RotateCcw } from "lucide-react";
import { requestReturn } from "@/actions/return";
import { useTranslations } from "next-intl";

const RETURN_REASONS = [
  { value: "단순 변심", key: "reasonChange" },
  { value: "사이즈 불일치", key: "reasonSize" },
  { value: "상품 불량/파손", key: "reasonDefect" },
  { value: "배송 오류 (잘못된 상품)", key: "reasonWrong" },
  { value: "상품 설명과 다름", key: "reasonDiff" },
  { value: "기타", key: "reasonEtc" },
];

export function ReturnRequestForm({ orderId }: { orderId: string }) {
  const [state, formAction, isPending] = useActionState(requestReturn, null);
  const [open, setOpen] = useState(false);
  const t = useTranslations("Mypage");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="text-xs gap-1" />}>
        <RotateCcw className="w-3.5 h-3.5" />
        {t("returnRequest")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("returnRequest")}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="orderId" value={orderId} />
          <div>
            <Label className="text-sm mb-2 block">{t("returnReason")}</Label>
            <div className="space-y-2">
              {RETURN_REASONS.map((reason) => (
                <label key={reason.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="reason" value={reason.value} required className="accent-black" />
                  <span className="text-sm">{t(reason.key)}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="description" className="text-sm mb-1.5">{t("returnDetail")}</Label>
            <Textarea id="description" name="description" placeholder={t("returnDetailPh")} rows={3} />
          </div>
          {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
          {state?.success && <p className="text-sm text-green-600">{t("returnSubmitted")}</p>}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? t("processing") : t("submitReturn")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
