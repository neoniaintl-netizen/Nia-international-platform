import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { safeCallbackUrl } from "@/lib/utils";

const { auth } = NextAuth(authConfig);

const protectedPaths = ["/my", "/wishlist", "/cart", "/checkout"];
const adminPaths = ["/admin"];
const authPaths = ["/login", "/register"];

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as any)?.role;

  // 보호 라우트 — 미인증 시 로그인으로 리다이렉트
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 관리자 라우트 — ADMIN 역할 필요
  const isAdmin = adminPaths.some((p) => pathname.startsWith(p));
  if (isAdmin) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  // 인증 페이지 — 로그인된 사용자는 callbackUrl 또는 홈으로 리다이렉트
  const isAuth = authPaths.some((p) => pathname.startsWith(p));
  if (isAuth && isLoggedIn) {
    const callbackUrl = safeCallbackUrl(nextUrl.searchParams.get("callbackUrl"));
    return NextResponse.redirect(new URL(callbackUrl, nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
