import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";

type GuardOk = { ok: true; session: Session };
type GuardFail = { ok: false; response: NextResponse };
export type GuardResult = GuardOk | GuardFail;

/**
 * Admin 권한이 필요한 API 라우트 가드.
 *
 * 사용 예:
 * ```ts
 * export async function POST(req: NextRequest) {
 *   const guard = await requireAdmin();
 *   if (!guard.ok) return guard.response;
 *   // ...
 * }
 * ```
 *
 * 반환:
 * - 비로그인: 401 Unauthorized
 * - 로그인했으나 ADMIN 아님: 403 Forbidden
 * - ADMIN: { ok: true, session }
 */
export async function requireAdmin(): Promise<GuardResult> {
  const session = (await auth()) as Session | null;

  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  // session.user.role은 auth.ts의 session 콜백에서 주입됨
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, session };
}

/**
 * 로그인 사용자임을 보장하는 가드 (role 무관).
 */
export async function requireUser(): Promise<GuardResult> {
  const session = (await auth()) as Session | null;

  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  return { ok: true, session };
}
