"use client";

import Script from "next/script";

/**
 * PortOne V2 Browser SDK 로더
 *
 * 체크아웃 페이지에 포함하면 window.PortOne 객체가 로드됩니다.
 * PG 연동 전에는 SDK가 로드되어도 실제 결제 호출을 하지 않으므로 안전합니다.
 */
export function PortOneScript() {
  return (
    <Script
      src="https://cdn.portone.io/v2/browser-sdk.js"
      strategy="lazyOnload"
    />
  );
}
