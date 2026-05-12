import { NextRequest, NextResponse } from "next/server";

/**
 * 관리자/운영용 API (`/api/admin/*`) 보호 헬퍼.
 *
 * 사용:
 *   const block = requireOpsToken(req);
 *   if (block) return block;
 *
 * 검증:
 *   - `process.env.ADMIN_OPS_TOKEN` 미설정 또는 16자 미만 → 401 (안전한 default-deny)
 *   - 요청의 `x-ops-token` 헤더 또는 `?token=` 쿼리가 env와 정확히 일치해야 통과
 *   - 비교는 length 먼저 / 그다음 문자열 비교 (timing attack 우려는 짧은 토큰이라 무시 가능 수준)
 *
 * 권장 사용 패턴: 헤더 사용 (URL 쿼리는 로그·Referer로 유출 위험)
 */
export function requireOpsToken(req: NextRequest): NextResponse | null {
  const expected = process.env.ADMIN_OPS_TOKEN;
  if (!expected || expected.length < 16) {
    return NextResponse.json(
      { error: "Ops token not configured" },
      { status: 401 },
    );
  }

  const provided =
    req.headers.get("x-ops-token") ?? req.nextUrl.searchParams.get("token");

  if (!provided || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
