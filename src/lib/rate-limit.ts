/**
 * Rate limiter with optional Upstash Redis backend.
 *
 * Backend selection:
 * - `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` env 가 모두 있으면 Upstash REST API 사용
 *   (멀티 인스턴스 환경에서도 정확)
 * - 없으면 in-memory Map fallback
 *   (싱글 인스턴스 한정. Railway 1 replica 환경이면 충분)
 *
 * 사용 예:
 * ```ts
 * const result = await rateLimit("login:" + ip, { limit: 5, windowMs: 60_000 });
 * if (!result.ok) return new NextResponse("Too Many Requests", { status: 429 });
 * ```
 */

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number; // epoch ms
}

// In-memory store. Map<key, { count, resetAt }>
const memoryStore = new Map<string, { count: number; resetAt: number }>();

// 메모리 누수 방지: 주기적으로 만료된 항목 정리
let cleanupTimer: NodeJS.Timeout | null = null;
function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryStore.entries()) {
      if (value.resetAt < now) memoryStore.delete(key);
    }
  }, 60_000);
  // 노드 종료 시 timer가 막지 않도록
  cleanupTimer.unref?.();
}

async function memoryRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  ensureCleanup();
  const now = Date.now();
  const existing = memoryStore.get(key);

  if (!existing || existing.resetAt < now) {
    const resetAt = now + options.windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return { ok: true, remaining: options.limit - 1, resetAt };
  }

  if (existing.count >= options.limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: options.limit - existing.count,
    resetAt: existing.resetAt,
  };
}

async function upstashRateLimit(
  key: string,
  options: RateLimitOptions,
  url: string,
  token: string
): Promise<RateLimitResult> {
  // 단순한 fixed-window 구현. INCR 후 EXPIRE.
  const ttlSec = Math.ceil(options.windowMs / 1000);
  const fullKey = `rl:${key}`;

  try {
    // INCR
    const incrRes = await fetch(`${url}/incr/${encodeURIComponent(fullKey)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!incrRes.ok) {
      // Upstash 장애 시 폴백: 통과 (가용성 우선)
      return memoryRateLimit(key, options);
    }
    const { result: count } = (await incrRes.json()) as { result: number };

    // 첫 요청이면 EXPIRE 설정
    if (count === 1) {
      await fetch(
        `${url}/expire/${encodeURIComponent(fullKey)}/${ttlSec}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      ).catch(() => {});
    }

    const resetAt = Date.now() + options.windowMs;
    if (count > options.limit) {
      return { ok: false, remaining: 0, resetAt };
    }
    return {
      ok: true,
      remaining: Math.max(0, options.limit - count),
      resetAt,
    };
  } catch {
    return memoryRateLimit(key, options);
  }
}

export async function rateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return upstashRateLimit(key, options, url, token);
  }
  return memoryRateLimit(key, options);
}

/**
 * IP 추출 헬퍼. Railway/Vercel/Cloudflare 등 프록시 뒷단에서 사용.
 * `x-forwarded-for`의 첫 번째 항목을 신뢰 — Railway 환경에서 안전.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
