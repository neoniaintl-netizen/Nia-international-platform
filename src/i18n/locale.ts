"use server";

import { cookies } from "next/headers";
import { locales, LOCALE_COOKIE, type Locale } from "./config";

/** 언어 스위처에서 호출 — 로케일 쿠키 설정 (1년 유지) */
export async function setUserLocale(locale: Locale) {
  if (!locales.includes(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
