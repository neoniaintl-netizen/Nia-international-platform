import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma as any),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        // 승인제: 미승인 회원은 로그인(세션 발급) 차단. ADMIN 은 예외.
        // 클라이언트 구분 메시지는 checkPendingApproval 서버액션이 담당.
        if (!user.approvedAt && user.role !== "ADMIN") return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.nickname,
          image: user.profileImage,
          role: user.role,
          nickname: user.nickname ?? undefined,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as any).role ?? "CUSTOMER";
        token.nickname = (user as any).nickname;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).nickname = token.nickname as string;
      }
      return session;
    },
  },
  events: {
    // OAuth로 처음 가입한 사용자에게 기본 role 설정
    async createUser({ user }) {
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "CUSTOMER" },
        });
      }
    },
  },
});
