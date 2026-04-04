"use client";

import { useActionState, useEffect, useState } from "react";
import { deleteAccount } from "@/actions/profile";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Loader2 } from "lucide-react";

export function DeleteAccountForm() {
  const [state, formAction, isPending] = useActionState(deleteAccount, null);
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
          <AlertTriangle className="w-4 h-4" /> 회원 탈퇴
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!open ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              회원 탈퇴 시 모든 개인 정보, 주문 내역, 리뷰, 적립금, 쿠폰이
              영구적으로 삭제되며 복구할 수 없습니다.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(true)}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              회원 탈퇴하기
            </Button>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-red-700">
                정말로 탈퇴하시겠습니까?
              </p>
              <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                <li>모든 주문 내역이 삭제됩니다</li>
                <li>작성한 리뷰와 문의가 삭제됩니다</li>
                <li>보유 적립금과 쿠폰이 소멸됩니다</li>
                <li>배송지 정보가 삭제됩니다</li>
                <li>탈퇴 후 동일 이메일로 재가입이 가능합니다</li>
              </ul>
            </div>

            <div>
              <Label htmlFor="confirmText" className="text-sm mb-1.5">
                확인을 위해 <strong className="text-red-600">&quot;회원탈퇴&quot;</strong>를 입력해주세요
              </Label>
              <Input
                id="confirmText"
                name="confirmText"
                placeholder="회원탈퇴"
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
                취소
              </Button>
              <Button
                type="submit"
                disabled={isPending || confirmText !== "회원탈퇴"}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> 처리 중...
                  </>
                ) : (
                  "회원 탈퇴"
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
