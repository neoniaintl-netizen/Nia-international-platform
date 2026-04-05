import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as any).role ?? "CUSTOMER";
        token.nickname = (user as any).nickname;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).nickname = token.nickname as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
