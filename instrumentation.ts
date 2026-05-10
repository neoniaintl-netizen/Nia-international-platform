/**
 * Next.js instrumentation hook.
 *
 * 매 컨테이너 시작 시 1회 실행. DB write 작업.
 *
 * 책임:
 * - placeholder만 가진 product를 sourceUrl(원본 사이트 URL)에서 fetch한
 *   og:image / JSON-LD product image로 자동 갱신 (1:1 정확 매핑)
 * - 30~35초 timeout. 한 번에 처리 못 한 product는 다음 deploy 시 처리
 * - 멱등성: 이미 진짜 이미지 가진 product는 skip
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { runFromSource } = await import(
      "./src/lib/server-init/cleanup-from-source"
    );
    runFromSource().catch((e) => {
      console.error(
        "[instrumentation] from-source failed (non-fatal):",
        e
      );
    });
  } catch (e) {
    console.error("[instrumentation] register failed (non-fatal):", e);
  }
}
