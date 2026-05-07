import { NextResponse } from "next/server";

/**
 * 안전한 에러 응답 헬퍼.
 *
 * 클라이언트에는 상태코드 + 안전 메시지만 노출하고,
 * 풀 에러는 서버 로그(console.error)로만 남긴다.
 *
 * 사용 예:
 * ```ts
 * try {
 *   ...
 * } catch (err) {
 *   return safeError(err, "주문 생성에 실패했습니다.", 500, "createOrder");
 * }
 * ```
 */
export function safeError(
  err: unknown,
  publicMessage: string,
  status: number = 500,
  context?: string
) {
  if (context) {
    console.error(`[${context}]`, err);
  } else {
    console.error(err);
  }
  return NextResponse.json({ error: publicMessage }, { status });
}
