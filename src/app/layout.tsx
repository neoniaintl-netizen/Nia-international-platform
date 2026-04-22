import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import AuthSessionProvider from "@/components/providers/session-provider";

// 한글: Pretendard Variable (globals.css에서 @import)
// 숫자: Geist Mono (가격 표시용)
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "NKBUS | 중국 수출 구매대행 & 패션 플랫폼",
    template: "%s | NKBUS",
  },
  description:
    "엔큐버스 - 한국 패션 브랜드의 중국 시장 진출을 돕는 구매대행 플랫폼. 골프웨어, 스포츠, 여성의류 도소매.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthSessionProvider>{children}</AuthSessionProvider>
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
