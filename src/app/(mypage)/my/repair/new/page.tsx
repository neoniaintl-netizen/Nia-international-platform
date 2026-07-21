"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createRepairRequestAction } from "@/actions/repair";
import { CheckCircle2, ChevronLeft } from "lucide-react";

export default function NewRepairPage() {
  const [state, formAction, isPending] = useActionState(
    createRepairRequestAction,
    null
  );
  const t = useTranslations("Mypage");

  if ((state as any)?.success) {
    return (
      <div className="max-w-md mx-auto py-10 text-center">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-600" />
        <h1 className="text-xl font-bold mb-2">{t("repairDone")}</h1>
        <p className="text-sm text-gray-600 mb-1">
          {t("receiptNo")} <span className="font-mono">{(state as any).requestNumber}</span>
        </p>
        <p className="text-xs text-gray-500 mb-6">
          {(state as any).message}
        </p>
        <div className="flex gap-2">
          <Link
            href="/my/repair"
            className="flex-1 h-11 bg-black text-white rounded-lg flex items-center justify-center text-sm font-bold"
          >
            {t("viewReceipts")}
          </Link>
          <Link
            href="/my"
            className="flex-1 h-11 bg-white border border-gray-300 rounded-lg flex items-center justify-center text-sm font-bold"
          >
            {t("myPage")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/my/repair"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-black mb-4"
      >
        <ChevronLeft className="w-3 h-3" />
        {t("toRepairList")}
      </Link>

      <h1 className="text-xl lg:text-2xl font-black mb-2">{t("repairApplyTitle")}</h1>
      <p className="text-xs text-gray-500 mb-8">
        {t("repairApplyDesc")}
      </p>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">
            {t("fProductName")} <span className="text-red-500">*</span>
          </label>
          <Input
            name="productName"
            placeholder={t("productNamePh")}
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">
            {t("brand")}
          </label>
          <Input name="brandName" placeholder={t("brandPh")} />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">
            {t("orderNo")}
          </label>
          <Input name="orderNumber" placeholder={t("orderNoPh")} />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">
            {t("repairContent")} <span className="text-red-500">*</span>
          </label>
          <Textarea
            name="issue"
            rows={5}
            placeholder={t("repairContentPh")}
            minLength={10}
            required
          />
          <p className="text-[10px] text-gray-400 mt-1">
            {t("repairContentHint")}
          </p>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">
            {t("pickupAddr")}
          </label>
          <Input
            name="pickupAddress"
            placeholder={t("pickupAddrPh")}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">
            {t("photoUrl")}
          </label>
          <Input
            name="imageUrls"
            placeholder={t("photoUrlPh")}
          />
          <p className="text-[10px] text-gray-400 mt-1">
            {t("photoUrlHint")}
          </p>
        </div>

        {state?.error && (
          <p className="text-sm text-[var(--sale)] text-center">{state.error}</p>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-12 bg-black hover:bg-gray-800 text-white font-bold text-sm rounded-lg"
        >
          {isPending ? t("submitting") : t("applyRepair")}
        </Button>
      </form>

      <div className="mt-8 bg-gray-50 rounded-xl p-4 text-[11px] text-gray-500 leading-relaxed">
        <p className="font-bold text-gray-700 mb-1">{t("repairGuideTitle2")}</p>
        <p>• {t("rg1")}</p>
        <p>• {t("rg2")}</p>
        <p>• {t("rg3")}</p>
        <p>• {t("rg4")}</p>
      </div>
    </div>
  );
}
