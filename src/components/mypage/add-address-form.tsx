"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { addAddress } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { DaumPostcodeButton } from "@/components/shared/daum-postcode";

export function AddAddressForm() {
  const [state, formAction, isPending] = useActionState(addAddress, null);
  const formRef = useRef<HTMLFormElement>(null);
  const address2Ref = useRef<HTMLInputElement>(null);
  const [zipCode, setZipCode] = useState("");
  const [address1, setAddress1] = useState("");

  const handleAddressComplete = useCallback(
    (data: { zipCode: string; address: string }) => {
      setZipCode(data.zipCode);
      setAddress1(data.address);
      setTimeout(() => address2Ref.current?.focus(), 100);
    },
    []
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("배송지가 추가되었습니다");
      formRef.current?.reset();
      setZipCode("");
      setAddress1("");
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="w-4 h-4" /> 새 배송지 추가
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="addr-label" className="text-sm mb-1.5">배송지명</Label>
              <Input id="addr-label" name="label" placeholder="집, 회사 등" defaultValue="집" />
            </div>
            <div>
              <Label htmlFor="addr-recipient" className="text-sm mb-1.5">수령인</Label>
              <Input id="addr-recipient" name="recipient" placeholder="이름" required />
            </div>
          </div>
          <div>
            <Label htmlFor="addr-phone" className="text-sm mb-1.5">연락처</Label>
            <Input id="addr-phone" name="phone" placeholder="010-0000-0000" required />
          </div>
          <div>
            <Label htmlFor="addr-zip" className="text-sm mb-1.5">우편번호</Label>
            <div className="flex gap-2">
              <Input
                id="addr-zip"
                name="zipCode"
                placeholder="우편번호"
                value={zipCode}
                readOnly
                required
                className="bg-gray-50 max-w-[140px]"
              />
              <DaumPostcodeButton onComplete={handleAddressComplete} />
            </div>
          </div>
          <div>
            <Label htmlFor="addr-1" className="text-sm mb-1.5">주소</Label>
            <Input
              id="addr-1"
              name="address1"
              placeholder="주소 검색 버튼을 눌러주세요"
              value={address1}
              readOnly
              required
              className="bg-gray-50"
            />
          </div>
          <div>
            <Label htmlFor="addr-2" className="text-sm mb-1.5">상세주소</Label>
            <Input id="addr-2" name="address2" ref={address2Ref} placeholder="상세주소를 입력하세요 (동/호수)" />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="addr-default" name="isDefault" />
            <label htmlFor="addr-default" className="text-sm">기본 배송지로 설정</label>
          </div>

          {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

          <Button type="submit" disabled={isPending} className="w-full bg-black hover:bg-gray-800 text-white">
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> 추가 중...</> : "배송지 추가"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
