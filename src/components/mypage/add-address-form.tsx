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
import { useTranslations } from "next-intl";

export function AddAddressForm() {
  const [state, formAction, isPending] = useActionState(addAddress, null);
  const t = useTranslations("Mypage");
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
      toast.success(t("addressAdded"));
      formRef.current?.reset();
      setZipCode("");
      setAddress1("");
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t("newAddress")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="addr-label" className="text-sm mb-1.5">{t("addrLabel")}</Label>
              <Input id="addr-label" name="label" placeholder={t("addrLabelPh")} defaultValue={t("addrLabelHome")} />
            </div>
            <div>
              <Label htmlFor="addr-recipient" className="text-sm mb-1.5">{t("recipient")}</Label>
              <Input id="addr-recipient" name="recipient" placeholder={t("recipientPh")} required />
            </div>
          </div>
          <div>
            <Label htmlFor="addr-phone" className="text-sm mb-1.5">{t("addrPhone")}</Label>
            <Input id="addr-phone" name="phone" placeholder="010-0000-0000" required />
          </div>
          <div>
            <Label htmlFor="addr-zip" className="text-sm mb-1.5">{t("zipCode")}</Label>
            <div className="flex gap-2">
              <Input
                id="addr-zip"
                name="zipCode"
                placeholder={t("zipCode")}
                value={zipCode}
                readOnly
                required
                className="bg-gray-50 max-w-[140px]"
              />
              <DaumPostcodeButton onComplete={handleAddressComplete} />
            </div>
          </div>
          <div>
            <Label htmlFor="addr-1" className="text-sm mb-1.5">{t("address")}</Label>
            <Input
              id="addr-1"
              name="address1"
              placeholder={t("addressPh")}
              value={address1}
              readOnly
              required
              className="bg-gray-50"
            />
          </div>
          <div>
            <Label htmlFor="addr-2" className="text-sm mb-1.5">{t("addressDetail")}</Label>
            <Input id="addr-2" name="address2" ref={address2Ref} placeholder={t("addressDetailPh")} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="addr-default" name="isDefault" />
            <label htmlFor="addr-default" className="text-sm">{t("setDefaultAddr")}</label>
          </div>

          {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

          <Button type="submit" disabled={isPending} className="w-full bg-black hover:bg-gray-800 text-white">
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {t("adding")}</> : t("addAddress")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
