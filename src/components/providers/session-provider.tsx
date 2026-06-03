"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

export default function AuthSessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  // server 에서 가져온 세션을 초기값으로 전달 → useSession 이 즉시 로그인 상태 반영
  // (초기값 없으면 client fetch 전까지 unauthenticated 로 잡혀 헤더/담기 버그)
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
