"use client";

import { useState, useTransition } from "react";
import { Globe, Check } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { setUserLocale } from "@/i18n/locale";
import { LOCALE_OPTIONS, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/**
 * 언어 스위처 — 검색바 왼쪽. 현재 언어(KR/EN/CN) 버튼 + 드롭다운.
 * 선택 시 쿠키 설정(setUserLocale) 후 router.refresh()로 재렌더.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const current =
    LOCALE_OPTIONS.find((l) => l.code === locale) ?? LOCALE_OPTIONS[0];

  function change(code: Locale) {
    setOpen(false);
    if (code === locale) return;
    startTransition(async () => {
      await setUserLocale(code);
      router.refresh();
    });
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        className="flex items-center gap-1.5 px-2 h-10 text-[12px] font-medium text-gray-500 hover:text-black transition-colors disabled:opacity-50"
        aria-label="언어 선택"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Globe className="w-[17px] h-[17px]" strokeWidth={1.6} />
        <span className="tracking-[0.08em]">{current.short}</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full mt-1 z-50 w-32 bg-white border border-[var(--line)] shadow-lg py-1">
            {LOCALE_OPTIONS.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => change(l.code)}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 text-[13px] text-left hover:bg-gray-50 transition-colors",
                  l.code === locale ? "text-black font-semibold" : "text-gray-600"
                )}
              >
                {l.label}
                {l.code === locale && <Check className="w-3.5 h-3.5" strokeWidth={2} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
