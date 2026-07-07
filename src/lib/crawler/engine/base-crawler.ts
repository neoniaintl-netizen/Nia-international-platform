import type { CrawledProduct } from "../types";
import type { SiteConfig } from "./types";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** 사이트당 초당 1회 초과 금지 — 요청 간 1.5~2초 랜덤 지터. */
export function randomDelay(min = 1500, max = 2000): Promise<void> {
  return delay(min + Math.floor((max - min) * Math.random()));
}

/** 재시도 3회 + 지수 백오프. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseMs = 1000,
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt === retries) throw e;
      await delay(baseMs * 2 ** (attempt - 1));
    }
  }
  throw new Error("unreachable");
}

export async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8" },
    signal: AbortSignal.timeout(15_000),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
  return res.text();
}

export async function fetchJson<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
  return res.json() as Promise<T>;
}

/** 모든 어댑터 공통 인터페이스. 사이트별 수집/파싱 구현. */
export interface Adapter {
  readonly platform: string;
  /** 리스트/sitemap/API에서 상품 상세 URL 목록 수집 */
  collectProductUrls(cfg: SiteConfig, limit: number): Promise<string[]>;
  /** 상세 HTML/JSON → CrawledProduct */
  parseDetail(raw: string, url: string, cfg: SiteConfig): CrawledProduct | null;
}
