/**
 * Next.js instrumentation hook.
 *
 * server 컨테이너 시작 시 1회 실행됨. tsx 외부 실행 의존성 없음 — Next 빌드
 * 시점에 함께 컴파일되므로 production에서도 안정적으로 동작.
 *
 * 책임:
 * - 카테고리 mismatch 자동 cleanup (의류 product에 골프 클럽/운동화/hero 박힌 케이스)
 * - 멱등성: 이미 처리된 상품은 변경 없음
 * - 실패해도 server start 차단하지 않음 (모든 에러 catch)
 */
export async function register() {
  // server 환경에서만 실행 (edge/middleware는 제외)
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    // dynamic import — 초기 server start 차단하지 않도록 비동기로 실행
    const { runCleanup } = await import("./src/lib/server-init/cleanup-mismatch");

    // 백그라운드 실행 — server start 보장
    runCleanup().catch((e) => {
      console.error("[instrumentation] cleanup failed (non-fatal):", e);
    });
  } catch (e) {
    console.error("[instrumentation] register failed (non-fatal):", e);
  }
}
