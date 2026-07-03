"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * 위안화 표시 환율 컨텍스트.
 * 루트 레이아웃(서버)이 결제와 동일한 FUNPAY_KRW_CNY_RATE 를 읽어 내려준다 —
 * 화면에 보이는 ≈¥ 금액과 실제 PG 청구액이 항상 같은 환율을 쓰도록.
 * null 이면(환율 미설정 또는 결제통화가 CNY 가 아님) ¥ 표시를 숨긴다.
 */
const CurrencyContext = createContext<number | null>(null);

export function CurrencyProvider({
  krwPerCny,
  children,
}: {
  krwPerCny: number | null;
  children: ReactNode;
}) {
  return (
    <CurrencyContext.Provider value={krwPerCny}>
      {children}
    </CurrencyContext.Provider>
  );
}

/** 1 CNY 당 원화 환율 (미설정 시 null) */
export function useKrwPerCny(): number | null {
  return useContext(CurrencyContext);
}

/** 체크아웃과 동일 포맷: ¥1,234.56 */
export function formatCny(cny: number): string {
  return (
    "¥" +
    cny.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}
