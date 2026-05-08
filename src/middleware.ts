import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { classifyUserAgent } from "@/lib/bot-detection";

const { auth } = NextAuth(authConfig);

const protectedPaths = ["/my", "/wishlist", "/cart", "/checkout"];
const adminPaths = ["/admin"];
const authPaths = ["/login", "/register"];

// honeypot 경로 — 사람 눈에 안 보이는 링크에서만 접근됨. 봇이 따라가면 즉시 차단.
const HONEYPOT_PATHS = ["/__hp_admin_secret", "/internal/dump", "/sitemap-old.xml"];

// 봇 차단을 적용할 경로 (정적 자산은 제외)
function shouldEnforceBotCheck(pathname: string): boolean {
  // API 경로는 각 라우트의 인증/검증으로 충분 — 미들웨어 봇 검사 생략 (PortOne webhook 등 정상 봇 호출 허용)
  if (pathname.startsWith("/api/")) return false;
  // Next.js 내부 경로
  if (pathname.startsWith("/_next/")) return false;
  // 정적 자산 (확장자 매칭)
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|eot|map|txt|xml)$/i.test(pathname)) return false;
  return true;
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as any)?.role;

  // ─── Honeypot ───
  // 사람 눈에 안 보이는 링크가 footer에 숨겨져 있고, 봇만 따라감. 즉시 401.
  if (HONEYPOT_PATHS.some((p) => pathname.startsWith(p))) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // ─── 봇/스크래퍼 차단 ───
  if (shouldEnforceBotCheck(pathname)) {
    const ua = req.headers.get("user-agent");
    const verdict = classifyUserAgent(ua);
    if (verdict === "block") {
      return new NextResponse("Forbidden", { status: 403 });
    }
    // "suspicious"는 차단하지 않음 — 일부 정상 클라이언트도 비표준 UA를 쓸 수 있음.
    // 행동 기반(rate limit) 차단은 각 라우트에서 처리.
  }

  // ─── 보호 라우트 — 미인증 시 로그인 리다이렉트 ───
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ─── 관리자 라우트 — ADMIN 역할 필요 ───
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

  // ─── 인증 페이지 — 이미 로그인된 사용자는 리다이렉트 ───
  const isAuth = authPaths.some((p) => pathname.startsWith(p));
  if (isAuth && isLoggedIn) {
    const callbackUrl = nextUrl.searchParams.get("callbackUrl") || "/";
    return NextResponse.redirect(new URL(callbackUrl, nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
