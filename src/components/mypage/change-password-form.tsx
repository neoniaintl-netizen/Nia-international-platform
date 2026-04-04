"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { changePassword } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction, isPending] = useActionState(changePassword, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  useEffect(() => {
    if (state?.success) {
      toast.success("비밀번호가 변경되었습니다");
      formRef.current?.reset();
      setNewPw("");
      setConfirmPw("");
    }
  }, [state]);

  // 소셜 로그인 전용 계정인 경우
  if (!hasPassword) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4" /> 비밀번호 변경
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            소셜 로그인으로 가입한 계정은 비밀번호를 변경할 수 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isMatch = newPw.length > 0 && confirmPw.length > 0 && newPw === confirmPw;
  const isLengthValid = newPw.length >= 6;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="w-4 h-4" /> 비밀번호 변경
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          {/* 현재 비밀번호 */}
          <div>
            <Label htmlFor="currentPassword" className="text-sm mb-1.5">
              현재 비밀번호
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                name="currentPassword"
                type={showCurrent ? "text" : "password"}
                placeholder="현재 비밀번호 입력"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 새 비밀번호 */}
          <div>
            <Label htmlFor="newPassword" className="text-sm mb-1.5">
              새 비밀번호
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showNew ? "text" : "password"}
                placeholder="새 비밀번호 입력 (6자 이상)"
                required
                minLength={6}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPw.length > 0 && (
              <p className={`text-xs mt-1 ${isLengthValid ? "text-green-600" : "text-red-500"}`}>
                {isLengthValid ? "사용 가능한 비밀번호입니다" : "비밀번호는 6자 이상이어야 합니다"}
              </p>
            )}
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <Label htmlFor="confirmPassword" className="text-sm mb-1.5">
              새 비밀번호 확인
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="새 비밀번호 다시 입력"
                required
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPw.length > 0 && (
              <div className="flex items-center gap-1 mt-1">
                {isMatch ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    <p className="text-xs text-green-600">비밀번호가 일치합니다</p>
                  </>
                ) : (
                  <p className="text-xs text-red-500">비밀번호가 일치하지 않습니다</p>
                )}
              </div>
            )}
          </div>

          {state?.error && (
            <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{state.error}</p>
          )}

          <Button
            type="submit"
            disabled={isPending || !isLengthValid || !isMatch}
            className="w-full bg-black hover:bg-gray-800 text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> 변경 중...
              </>
            ) : (
              "비밀번호 변경"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
