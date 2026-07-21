"use client";

import { useActionState, useEffect, useState } from "react";
import { deleteAccount } from "@/actions/profile";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function DeleteAccountForm() {
  const [state, formAction, isPending] = useActionState(deleteAccount, null);
  const t = useTranslations("Mypage");
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (state?.success) {
      // 탈퇴 성공 시 로그아웃 후 홈으로 이동
      signOut({ callbackUrl: "/" });
    }
  }, [state]);

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-4 h-4" /> {t("withdrawTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!open ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              {t("withdrawDesc")}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(true)}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              {t("withdrawBtn")}
            </Button>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-red-700">
                {t("withdrawConfirmQ")}
              </p>
              <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                <li>{t("withdrawItem1")}</li>
                <li>{t("withdrawItem2")}</li>
                <li>{t("withdrawItem3")}</li>
                <li>{t("withdrawItem4")}</li>
                <li>{t("withdrawItem5")}</li>
              </ul>
            </div>

            <div>
              <Label htmlFor="confirmText" className="text-sm mb-1.5">
                {t("withdrawTypePrompt", { kw: `"${t("withdrawKeyword")}"` })}
              </Label>
              <Input
                id="confirmText"
                name="confirmText"
                placeholder={t("withdrawKeyword")}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="border-red-300 focus-visible:ring-red-400"
                autoComplete="off"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-red-500">{state.error}</p>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setConfirmText("");
                }}
                className="flex-1"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isPending || confirmText !== t("withdrawKeyword")}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> {t("processing")}
                  </>
                ) : (
                  t("withdraw")
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
