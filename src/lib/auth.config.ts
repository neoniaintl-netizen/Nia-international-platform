import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      // 보호 라우트
      const protectedPaths = ["/my", "/wishlist", "/cart", "/checkout"];
      const isProtected = protectedPaths.some((p) => nextUrl.pathname.startsWith(p));
      const isAdmin = nextUrl.pathname.startsWith("/admin");
      const isAuth = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");

      if (isAdmin) {
        if (!isLoggedIn) return false;
        const role = (auth?.user as any)?.role;
        if (role !== "ADMIN") {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      if (isProtected && !isLoggedIn) return false;

      // 로그인된 사용자는 인증 페이지 접근 불가 → callbackUrl 또는 홈으로
      if (isAuth && isLoggedIn) {
        const callbackUrl = nextUrl.searchParams.get("callbackUrl") || "/";
        return Response.redirect(new URL(callbackUrl, nextUrl));
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
