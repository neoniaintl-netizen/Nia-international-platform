/**
 * Next.js instrumentation hook.
 *
 * 자동 cleanup은 의도적으로 비활성화됨 (사용자 결정으로 처음 크롤링 상태로 롤백).
 * 추후 type 분류기/풀 매핑이 정확해지면 재활성화 검토.
 */
export async function register() {
  // 자동 mismatch cleanup 비활성화 — 운영자가 어드민에서 수동 처리
  // if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // const { runCleanup } = await import("./src/lib/server-init/cleanup-mismatch");
  // runCleanup().catch(() => {});
}
