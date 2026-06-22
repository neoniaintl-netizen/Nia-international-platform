export const locales = ["ko", "en", "zh"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ko";

/** 로케일 쿠키 이름 (URL 라우팅 없이 쿠키로 언어 결정) */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** 언어 스위처 표시용 */
export const LOCALE_OPTIONS: { code: Locale; label: string; short: string }[] = [
  { code: "ko", label: "한국어", short: "KR" },
  { code: "en", label: "English", short: "EN" },
  { code: "zh", label: "中文", short: "CN" },
];
