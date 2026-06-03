import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 오픈 리다이렉트 방지 — callbackUrl 은 내부 절대경로만 허용.
 *  - "/" 로 시작 (절대경로)
 *  - "//" 로 시작 금지 (프로토콜 상대 URL → 외부 도메인 우회)
 *  - 백슬래시/제어문자 금지 (`/\evil.com` 등 우회 차단)
 * 위반 시 fallback("/") 반환.
 */
export function safeCallbackUrl(url: string | null | undefined, fallback = "/"): string {
  if (!url || typeof url !== "string") return fallback;
  if (!url.startsWith("/")) return fallback;
  if (url.startsWith("//")) return fallback;
  if (url.includes("\\")) return fallback;
  // 제어문자(U+0000–U+001F, U+007F) 차단
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f\x7f]/.test(url)) return fallback;
  return url;
}
