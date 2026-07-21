"use client";

import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeResult) => void;
        onclose?: () => void;
        width?: string | number;
        height?: string | number;
      }) => { open: () => void; embed: (element: HTMLElement) => void };
    };
  }
}

interface DaumPostcodeResult {
  zonecode: string;     // 우편번호 (5자리)
  address: string;      // 기본 주소
  addressType: string;  // R(도로명) / J(지번)
  roadAddress: string;  // 도로명 주소
  jibunAddress: string; // 지번 주소
  buildingName: string; // 건물명
  apartment: string;    // 아파트 여부 (Y/N)
  bname: string;        // 법정동/법정리
  bname1: string;       // 법정동/법정리 첫번째
  sido: string;         // 시/도
  sigungu: string;      // 시/군/구
}

interface DaumPostcodeProps {
  onComplete: (data: { zipCode: string; address: string }) => void;
  className?: string;
}

const SCRIPT_URL = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

let scriptLoaded = false;
let scriptLoading = false;
const callbacks: (() => void)[] = [];

function loadScript(): Promise<void> {
  return new Promise((resolve) => {
    if (scriptLoaded) {
      resolve();
      return;
    }

    if (scriptLoading) {
      callbacks.push(resolve);
      return;
    }

    scriptLoading = true;
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
      callbacks.forEach((cb) => cb());
      callbacks.length = 0;
    };
    document.head.appendChild(script);
  });
}

export function DaumPostcodeButton({ onComplete, className }: DaumPostcodeProps) {
  const t = useTranslations("Common");
  const handleClick = useCallback(async () => {
    await loadScript();

    new window.daum.Postcode({
      oncomplete(data: DaumPostcodeResult) {
        // 도로명 주소 우선, 없으면 지번 주소
        let fullAddress = data.roadAddress || data.jibunAddress;

        // 건물명이 있으면 추가
        if (data.buildingName) {
          fullAddress += ` (${data.buildingName})`;
        }

        onComplete({
          zipCode: data.zonecode,
          address: fullAddress,
        });
      },
    }).open();
  }, [onComplete]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={className}
    >
      <Search className="w-3.5 h-3.5 mr-1.5" />
      {t("searchAddress")}
    </Button>
  );
}
