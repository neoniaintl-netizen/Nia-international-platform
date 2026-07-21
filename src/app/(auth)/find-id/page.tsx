"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { findIdAction } from "@/actions/auth";
import { CheckCircle2 } from "lucide-react";

export default function FindIdPage() {
  const [state, formAction, isPending] = useActionState(findIdAction, null);
  const t = useTranslations("Auth");

  return (
    <div className="w-full max-w-sm mx-auto">
      <h1 className="text-2xl font-black text-center mb-2">{t("findIdTitle")}</h1>
      <p className="text-center text-xs text-gray-500 mb-8">
        {t("findIdDesc")}
      </p>

      {(state as any)?.success ? (
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-600" />
          <p className="text-xs text-gray-500 mb-1">{t("yourId")}</p>
          <p className="text-lg font-bold">{(state as any).email}</p>
          <p className="text-[11px] text-gray-400 mt-2">
            {t("joinedDate")}: {(state as any).createdAt}
          </p>
          <div className="flex gap-2 mt-6">
            <Link
              href="/login"
              className="flex-1 h-11 bg-black text-white rounded-lg flex items-center justify-center text-sm font-bold"
            >
              {t("login")}
            </Link>
            <Link
              href="/forgot-password"
              className="flex-1 h-11 bg-white border border-gray-300 rounded-lg flex items-center justify-center text-sm font-bold"
            >
              {t("findPassword")}
            </Link>
          </div>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <Input
            name="name"
            placeholder={t("namePh")}
            className="h-12 bg-gray-50 border-gray-200 rounded-lg text-sm"
            required
          />
          <Input
            name="phone"
            type="tel"
            placeholder={t("phonePh")}
            className="h-12 bg-gray-50 border-gray-200 rounded-lg text-sm"
            required
          />

          {state?.error && (
            <p className="text-sm text-[var(--sale)] text-center">
              {state.error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-12 bg-black hover:bg-gray-800 text-white font-bold text-sm rounded-lg"
          >
            {isPending ? t("searching") : t("findIdBtn")}
          </Button>
        </form>
      )}

      <div className="flex items-center justify-center gap-4 mt-6 text-xs text-gray-400">
        <Link href="/login" className="hover:text-black">
          {t("login")}
        </Link>
        <span>|</span>
        <Link href="/forgot-password" className="hover:text-black">
          {t("findPassword")}
        </Link>
        <span>|</span>
        <Link href="/register" className="hover:text-black">
          {t("register")}
        </Link>
      </div>
    </div>
  );
}
