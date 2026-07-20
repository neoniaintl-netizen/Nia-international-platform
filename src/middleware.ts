import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { safeCallbackUrl } from "@/lib/utils";

const { auth } = NextAuth(authConfig);

/**
 * 회원전용 폐쇄몰 게이트.
 *
 * 정책: 아래 공개 화이트리스트를 제외한 **모든 스토어프론트 페이지는 로그인 필요**.
 * 비로그인 접근 시 /login 으로 리다이렉트(callbackUrl 보존).
 *
 * ⚠️ 결제/크롤 보호: matcher 에서 `/api` 전체를 제외한다. PG(Funpay/ICB) 결제 노티
 *    (`/api/payment/funpay/notify`)와 GitHub Actions 크롤(`/api/crawl`)은 세션 쿠키 없이
 *    외부에서 호출되므로 미들웨어가 절대 개입하면 안 된다. 각 API 는 자체 인증을 가진다.
 */

// 로그인 없이 접근 가능한 공개 경로 (프리픽스 매칭)
const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/find-id",
  "/order-lookup",
  "/policy", // 이용약관·개인정보처리방침 등 (가입 전·푸터 접근)
];
const AUTH_PATHS = ["/login", "/register"];
const ADMIN_PATHS = ["/admin"];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as { role?: string } | undefined)?.role;

  // 1) 관리자 — ADMIN 역할 필요 (기존 유지)
  if (matchesPrefix(pathname, ADMIN_PATHS)) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== "ADMIN") return NextResponse.redirect(new URL("/", nextUrl));
    return NextResponse.next();
  }

  // 2) 인증 페이지(/login·/register) — 로그인 상태면 되돌려보냄
  if (matchesPrefix(pathname, AUTH_PATHS)) {
    if (isLoggedIn) {
      const cb = safeCallbackUrl(nextUrl.searchParams.get("callbackUrl"));
      return NextResponse.redirect(new URL(cb || "/", nextUrl));
    }
    return NextResponse.next();
  }

  // 3) 그 외 공개 화이트리스트 — 통과
  if (matchesPrefix(pathname, PUBLIC_PREFIXES)) {
    return NextResponse.next();
  }

  // 4) 폐쇄몰 게이트 — 나머지 모든 페이지는 로그인 필요
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname + nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // /api 전체(자체 인증) + 정적 자원 제외 → 스토어프론트 페이지에만 게이트 적용.
    // (api/auth 뿐 아니라 결제 노티·크롤 등 모든 api 를 보호)
    "/((?!api|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
