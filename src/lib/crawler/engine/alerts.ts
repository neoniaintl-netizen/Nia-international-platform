// 크롤 알림 — 수집 0건 또는 전일(이전 실행) 대비 -50% 급감 감지.
// 슬랙 웹훅은 훅 함수만 제공(URL은 SLACK_WEBHOOK_URL env, 미설정 시 no-op).

/** 경고 메시지 반환(없으면 null). collected=이번 수집수, prev=직전 실행 수집수. */
export function evaluateCrawlAlert(collected: number, prev: number | null): string | null {
  if (collected === 0) return "수집 0건";
  if (prev != null && prev > 0 && collected < prev * 0.5) {
    const pct = Math.round((1 - collected / prev) * 100);
    return `전일 대비 -${pct}% 급감 (이전 ${prev} → 이번 ${collected})`;
  }
  return null;
}

/** 슬랙 웹훅 알림. SLACK_WEBHOOK_URL 미설정 시 no-op(훅만 존재). 실패해도 크롤 안 막음. */
export async function notifySlack(message: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `[NOVAREN 크롤] ${message}` }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    /* 알림 실패는 크롤을 막지 않음 */
  }
}
