"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

/**
 * 결제 확정 대기 화면.
 * Funpay returnurl 로 복귀했지만 statusurl 노티가 아직 처리 전이면 주문이 PENDING.
 * 일정 주기로 router.refresh() 해서 서버에서 PAID 확정됐는지 다시 조회.
 * 일정 시간 내 확정 안 되면 "확인 지연" 안내 (노티는 최대 55분까지 재시도되므로 주문내역에서 확인 유도).
 */
// 노티가 40~60초대에 도착하는 경우가 있어 3분까지 폴링 (이후엔 수동 "다시 확인" 버튼)
export function PaymentPending({ maxSeconds = 180 }: { maxSeconds?: number }) {
  const router = useRouter();
  const t = useTranslations("Common");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (elapsed >= maxSeconds) return;
    const t = setTimeout(() => {
      setElapsed((e) => e + 3);
      router.refresh();
    }, 3000);
    return () => clearTimeout(t);
  }, [elapsed, maxSeconds, router]);

  const timedOut = elapsed >= maxSeconds;

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      {!timedOut ? (
        <>
          <Loader2 className="w-14 h-14 text-gray-400 mx-auto mb-4 animate-spin" />
          <h1 className="text-xl font-bold mb-2">{t("payChecking")}</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            {t("payCheckingDesc")}
            <br />
            {t("payCheckingWait")} ({elapsed}s)
          </p>
        </>
      ) : (
        <>
          <XCircle className="w-14 h-14 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">{t("payDelayed")}</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            {t("payDelayedDesc")}
            <br />
            {t("payDelayedDesc2")}
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/my/orders">
              <Button variant="outline" className="h-11">{t("viewOrders")}</Button>
            </Link>
            <Button
              className="h-11 bg-black text-white"
              onClick={() => {
                setElapsed(0);
                router.refresh();
              }}
            >
              {t("recheck")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
