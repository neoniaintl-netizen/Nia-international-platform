"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";
import {
  PORTONE_CONFIG,
  PAYMENT_METHOD_MAP,
  generateMerchantUid,
} from "@/lib/payment";

interface PaymentButtonProps {
  amount: number;
  orderName: string;
  paymentMethod: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  onSuccess: (paymentData: {
    paymentId: string;
    merchantUid: string;
  }) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export function PaymentButton({
  amount,
  orderName,
  paymentMethod,
  buyerName,
  buyerPhone,
  buyerEmail,
  onSuccess,
  onError,
  disabled,
}: PaymentButtonProps) {
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    setProcessing(true);

    try {
      // =====================================================
      // PG 연동 시: PortOne SDK 호출
      // TODO: 실제 PG 연동 시 아래 주석 해제
      // =====================================================
      /*
      if (typeof window !== "undefined" && window.PortOne) {
        const merchantUid = generateMerchantUid();
        const methodConfig =
          PAYMENT_METHOD_MAP[paymentMethod] || PAYMENT_METHOD_MAP.CARD;

        const response = await window.PortOne.requestPayment({
          storeId: PORTONE_CONFIG.storeId,
          channelKey: PORTONE_CONFIG.channelKey,
          paymentId: merchantUid,
          orderName,
          totalAmount: amount,
          currency: "CURRENCY_KRW",
          payMethod: methodConfig.payMethod,
          customer: {
            fullName: buyerName,
            phoneNumber: buyerPhone,
            email: buyerEmail,
          },
          redirectUrl: `${window.location.origin}/checkout/complete`,
        });

        if (response.code) {
          // 결제 실패 또는 사용자 취소
          onError(response.message || "결제가 취소되었습니다.");
          return;
        }

        // 결제 성공 - 서버에서 금액 검증
        const verifyResponse = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentId: response.paymentId,
            orderId: merchantUid,
            expectedAmount: amount,
          }),
        });

        const verifyResult = await verifyResponse.json();
        if (!verifyResult.success) {
          onError(verifyResult.error || "결제 검증에 실패했습니다.");
          return;
        }

        onSuccess({ paymentId: response.paymentId, merchantUid });
        return;
      }
      */

      // =====================================================
      // 테스트 모드: PG 없이 바로 성공 처리
      // TODO: PG 연동 후 위 코드 주석 해제하고 아래 코드 삭제
      // =====================================================

      // suppress unused var lint (used in commented PG code above)
      void PORTONE_CONFIG;
      void PAYMENT_METHOD_MAP;
      void orderName;
      void buyerName;
      void buyerPhone;
      void buyerEmail;

      const merchantUid = generateMerchantUid();

      const verifyResponse = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: `TEST-${Date.now()}`,
          orderId: merchantUid,
          expectedAmount: amount,
        }),
      });

      const verifyResult = await verifyResponse.json();
      if (!verifyResult.success) {
        onError(verifyResult.error || "결제 처리에 실패했습니다.");
        return;
      }

      onSuccess({ paymentId: verifyResult.paymentId, merchantUid });
    } catch {
      onError("결제 처리 중 오류가 발생했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handlePayment}
        disabled={disabled || processing}
        className="w-full h-14 bg-black hover:bg-gray-800 text-white font-bold text-base"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            결제 처리중...
          </>
        ) : (
          `${amount.toLocaleString()}원 결제하기`
        )}
      </Button>
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>안전한 결제 시스템 (PortOne)</span>
      </div>
    </div>
  );
}

// PortOne SDK 타입 선언 (V2)
declare global {
  interface Window {
    PortOne?: {
      requestPayment: (config: Record<string, unknown>) => Promise<{
        code?: string;
        message?: string;
        paymentId?: string;
      }>;
    };
  }
}
