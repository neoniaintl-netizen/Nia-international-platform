import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import AuthSessionProvider from "@/components/providers/session-provider";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { auth } from "@/lib/auth";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

// 한글: Pretendard Variable (globals.css에서 @import)
// 숫자: Geist Mono (가격 표시용)
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "NOVAREN | 중국 수출 구매대행 & 패션 플랫폼",
    template: "%s | NOVAREN",
  },
  description:
    "노바렌 - 한국 패션 브랜드의 중국 시장 진출을 돕는 구매대행 플랫폼. 골프웨어, 스포츠, 여성의류 도소매.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const locale = await getLocale();
  const messages = await getMessages();
  // 결제와 동일한 환율로 전 페이지 ≈¥ 표시 (결제통화가 CNY 일 때만)
  const fxRate = Number(process.env.FUNPAY_KRW_CNY_RATE ?? "0");
  const krwPerCny =
    (process.env.FUNPAY_CURRENCY ?? "").toUpperCase() === "CNY" &&
    Number.isFinite(fxRate) &&
    fxRate > 0
      ? fxRate
      : null;
  return (
    <html
      lang={locale}
      className={`${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CurrencyProvider krwPerCny={krwPerCny}>
            <AuthSessionProvider session={session}>{children}</AuthSessionProvider>
          </CurrencyProvider>
        </NextIntlClientProvider>
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
