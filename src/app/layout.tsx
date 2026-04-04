import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import AuthSessionProvider from "@/components/providers/session-provider";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NKBUS | 온라인 패션 스토어",
    template: "%s | NKBUS",
  },
  description: "엔큐버스 - 트렌디한 패션 아이템을 만나보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geist.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
