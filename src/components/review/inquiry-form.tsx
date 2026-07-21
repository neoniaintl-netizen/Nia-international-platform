"use client";

import { useActionState, useEffect, useRef } from "react";
import { createInquiry } from "@/actions/inquiry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function InquiryForm({ productId }: { productId: string }) {
  const [state, formAction, isPending] = useActionState(createInquiry, null);
  const formRef = useRef<HTMLFormElement>(null);
  const t = useTranslations("Common");

  useEffect(() => {
    if (state?.success) {
      toast.success(t("inquirySubmitted"));
      formRef.current?.reset();
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3 border rounded-xl p-4">
      <input type="hidden" name="productId" value={productId} />
      <Input name="title" placeholder={t("inquiryTitlePh")} required className="text-sm" />
      <Textarea
        name="content"
        placeholder={t("inquiryContentPh")}
        rows={3}
        className="resize-none text-sm"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox id="inquiry-secret" name="isSecret" />
          <label htmlFor="inquiry-secret" className="text-xs text-gray-500">
            {t("secretPostLabel")}
          </label>
        </div>
        <Button
          type="submit"
          disabled={isPending}
          size="sm"
          className="bg-black hover:bg-gray-800 text-white"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            t("submitInquiry")
          )}
        </Button>
      </div>
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
    </form>
  );
}
