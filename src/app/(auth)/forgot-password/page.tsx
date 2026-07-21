"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requestPasswordResetAction } from "@/actions/auth";
import { CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordResetAction,
    null
  );
  const t = useTranslations("Auth");

  return (
    <div className="w-full max-w-sm mx-auto">
      <h1 className="text-2xl font-black text-center mb-2">{t("forgotTitle")}</h1>
      <p className="text-center text-xs text-gray-500 mb-8">
        {t("forgotDesc")}
      </p>

      {(state as any)?.success ? (
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-600" />
          <p className="text-sm text-gray-700">{(state as any).message}</p>
          <Link
            href="/login"
            className="block mt-6 h-11 bg-black text-white rounded-lg flex items-center justify-center text-sm font-bold"
          >
            {t("backToLogin")}
          </Link>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <Input
            name="email"
            type="email"
            placeholder={t("emailPh")}
            className="h-12 bg-gray-50 border-gray-200 rounded-lg text-sm"
            required
            autoComplete="email"
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
            {isPending ? t("sending") : t("getResetLink")}
          </Button>
        </form>
      )}

      <div className="flex items-center justify-center gap-4 mt-6 text-xs text-gray-400">
        <Link href="/login" className="hover:text-black">
          {t("login")}
        </Link>
        <span>|</span>
        <Link href="/find-id" className="hover:text-black">
          {t("findId")}
        </Link>
        <span>|</span>
        <Link href="/register" className="hover:text-black">
          {t("register")}
        </Link>
      </div>

      <p className="text-[11px] text-gray-400 text-center mt-8 leading-relaxed">
        {t("spamNotice")}
      </p>
    </div>
  );
}
