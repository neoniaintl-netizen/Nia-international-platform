# 골프웨어 크롤링 시스템 재구축 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 골프웨어 자사몰 ~18개 + 플랫폼 2개에서 상품을 수집해 NOVAREN 프로덕션 DB에 DRAFT로 공급하는, 설정 기반·3단계 폴백 TS 크롤러를 재구축한다.

**Architecture:** 기존 TS/Prisma 스택 위에 신규 크롤러 엔진을 나란히 구축(build-alongside-then-swap). `product-importer`·`CrawlJob`·`/admin` 검수 플로우는 재사용. 앱 밖 CLI 배치로 실행하고 프로덕션 DB에 DRAFT 기록.

**Tech Stack:** TypeScript, `fetch`(내장), cheerio, playwright(tier-3 로컬 전용), Prisma. 테스트는 `node:assert` + `npx tsx`(신규 의존성 없음).

---

## 실행 게이트 구조 (사용자 지정 — 반드시 준수)

- **Phase 1** (정찰): 확인 없이 자동 착수·완주 → 결과 **보고만**.
- 접근 불가/봇차단 사이트는 **실행자 판단으로 후순위** 처리 후 Phase 2 자동 진행.
- **Phase 2** (파일럿): 결과는 **반드시 사용자 승인** — 유일한 게이트. 여기서 멈춘다.
- **Phase 3**: Phase 2 승인 후 확인 없이 완주 → 성공률 리포트만.
- **커밋**: Phase 단위 로컬 커밋. **푸시는 사용자 지시 전까지 금지.**

---

## File Structure

**신규 (build-alongside — 기존 파일 미변경):**
- `src/lib/crawler/engine/types.ts` — SiteConfig, 수집 관련 타입 (기존 `CrawledProduct` 재사용)
- `src/lib/crawler/engine/harness.ts` — 경량 테스트 하네스 (test/report)
- `src/lib/crawler/engine/content-hash.ts` — 가격+품절+옵션 해시
- `src/lib/crawler/engine/robots.ts` — robots.txt fetch+parse+allow 판정
- `src/lib/crawler/engine/base-crawler.ts` — fetch/retry/delay + tier 파이프라인
- `src/lib/crawler/engine/scheduler.ts` — 사이트 간 동시성 상한 + 사이트 내 순차
- `src/lib/crawler/engine/storage.ts` — importer 래퍼 (sourceProductId/contentHash)
- `src/lib/crawler/adapters/cafe24.ts` / `godomall.ts` / `shopify.ts` / `custom.ts`
- `src/lib/crawler/sites.config.ts` — SiteConfig[] (recon 결과 반영)
- `scripts/crawl.ts` — CLI 진입점
- `src/lib/crawler/engine/__tests__/*.test.ts` + `run.ts` — 테스트
- `docs/crawler-fixtures/<siteId>/*.html` — recon이 캡처한 실제 HTML (셀렉터 근거)
- `docs/site_analysis.md` — Phase 1 정찰 표
- `prisma/migrations/<ts>_add_crawler_source_fields/migration.sql` — 컬럼 2개

**재사용 (미변경):** `src/lib/crawler/product-importer.ts`, `src/lib/crawler/types.ts`(CrawledProduct), `CrawlJob` 모델, `/admin/crawl`.

**Phase 3 스왑 시점에만 변경:** `src/lib/crawler/index.ts`(getCrawler를 신규 엔진으로 배선), `src/actions/crawl.ts`(신규 스토리지 호출).

---

## Phase 1 — 사이트 정찰 (코드 없음, TDD 아님 — 조사)

> 추측 금지. 실제 요청으로만 검증. 각 사이트 원본 HTML을 fixture로 저장(Phase 2 어댑터 테스트 근거).

### Task 1.1: 정찰 대상 목록 확정 + 디렉토리 준비

**Files:** Create `docs/crawler-fixtures/.gitkeep`

- [ ] **Step 1:** 대상 20개 목록을 [PLATFORM_PURPOSE.md](../../../PLATFORM_PURPOSE.md)와 스펙에서 확정 (버킷스토어, 더카트, 말본, 지포어, 사우스케이프, 어메이징크리, 랑방블랑, 데상트골프, PXG, 어뉴, 풋조이, 보스골프, 마크앤로나, 왁, 아이스버그, 유타, 펠트, 타이틀리스트, 나이키골프).
- [ ] **Step 2:** `mkdir -p docs/crawler-fixtures && touch docs/crawler-fixtures/.gitkeep`
- [ ] **Step 3:** Commit: `git add -A && git commit -m "chore(crawler): recon fixture 디렉토리 준비"`

### Task 1.2: 사이트별 정찰 (사이트당 반복)

각 사이트에 대해 아래를 `fetch`로 실제 수행 (사이트 간 1.5~2초 간격 준수):

- [ ] **Step 1: robots.txt 확인** — `GET {baseUrl}/robots.txt` → 차단 경로·sitemap 위치 기록.
- [ ] **Step 2: 플랫폼 판별** — 홈 HTML에서 `EC_FRONT`/`cafe24`(Cafe24), `godo`/`gd_`(고도몰), `Shopify.`/`cdn/shop`(Shopify), 그 외 custom.
- [ ] **Step 3: tier-1 JSON API 탐침** — 플랫폼별 알려진 패턴 시도:
      - Shopify: `GET {baseUrl}/products.json?limit=5` → 200+JSON이면 tier-1.
      - Cafe24: 상품 목록/상세에서 `product_no`, EC API 흔적 확인.
      - sitemap: `GET {sitemap}` → `/product/` URL 수집 가능 여부.
- [ ] **Step 4: 정적 HTML 여부** — 카테고리/상품 페이지 HTML에 상품 카드·가격·이미지가 **SSR로 들어있는지** 확인 (JS 없이 보이면 tier-2, 비면 tier-3 후보).
- [ ] **Step 5: 봇 차단 여부** — 403/429/캡차 여부 기록 (예: 풋조이는 한국 IP 403 이력).
- [ ] **Step 6: 필드 위치 기록** — 상품 상세 1건에서 가격/할인가/품절/옵션/이미지가 어디(JSON-LD/메타/전역변수/셀렉터)에 있는지 실제 확인.
- [ ] **Step 7: fixture 저장** — 상품 상세 HTML 1~2건을 `docs/crawler-fixtures/<siteId>/detail-1.html`로 저장. (JSON API면 응답 JSON도 저장.)
- [ ] **Step 8: strategy 판정** — `json_api` / `static_html` / `playwright` / `blocked` 중 하나 기록.

### Task 1.3: `docs/site_analysis.md` 작성 + 보고

- [ ] **Step 1:** 아래 컬럼 표로 정리:
      `| 사이트 | 플랫폼 | robots 정책 | tier-1 API | JS렌더 | 봇차단 | strategy | 가격/할인/품절/옵션/이미지 위치 | 비고 |`
- [ ] **Step 2:** 접근 불가/봇차단 사이트는 사유 명시 + **후순위(수동 등록 대상) 분류**.
- [ ] **Step 3:** 파일럿 3개 후보 선정 근거 기록: 버킷스토어(플랫폼) + Cafe24 계열 1개(예: 어뉴/유타/펠트 중 tier 우수) + 자체몰 1개(tier-1 있는 곳 우선).
- [ ] **Step 4:** Commit: `git commit -m "docs(crawler): Phase 1 사이트 정찰 결과"`
- [ ] **Step 5:** 사용자에게 **보고** (게이트 아님) 후 Phase 2 자동 진행.

---

## Phase 2 — 코어 + 파일럿 3개 (TDD) ⟶ **승인 게이트**

### Task 2.1: 테스트 하네스

**Files:** Create `src/lib/crawler/engine/harness.ts`, `src/lib/crawler/engine/__tests__/run.ts`

- [ ] **Step 1: 하네스 작성**
```ts
// src/lib/crawler/engine/harness.ts
type TestFn = () => void | Promise<void>;
const cases: Array<{ name: string; fn: TestFn }> = [];
export function test(name: string, fn: TestFn) { cases.push({ name, fn }); }
export async function report(): Promise<void> {
  let passed = 0, failed = 0;
  for (const c of cases) {
    try { await c.fn(); console.log(`  ✓ ${c.name}`); passed++; }
    catch (e: any) { console.log(`  ✗ ${c.name}\n    ${e.message}`); failed++; }
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}
```
- [ ] **Step 2: 러너 작성**
```ts
// src/lib/crawler/engine/__tests__/run.ts
import { report } from "../harness";
// 각 테스트 파일을 여기서 import (아래 태스크에서 추가)
import "./content-hash.test";
await report();
```
- [ ] **Step 3: 실행 스크립트 확인** — `npx tsx src/lib/crawler/engine/__tests__/run.ts` (첫 import는 content-hash 태스크에서 생성되므로 2.2 이후 통과).
- [ ] **Step 4: Commit** — `git commit -m "test(crawler): 경량 테스트 하네스"`

### Task 2.2: content-hash 모듈

**Files:** Create `engine/content-hash.ts`, `engine/__tests__/content-hash.test.ts`

- [ ] **Step 1: 실패 테스트**
```ts
// engine/__tests__/content-hash.test.ts
import assert from "node:assert";
import { test } from "../harness";
import { contentHash } from "../content-hash";
test("동일 입력 → 동일 해시", () => {
  const a = contentHash({ originalPrice: 100, salePrice: 90, soldOut: false, options: ["S","M"] });
  const b = contentHash({ originalPrice: 100, salePrice: 90, soldOut: false, options: ["M","S"] });
  assert.equal(a, b); // 옵션 순서 무관
});
test("가격 변경 → 다른 해시", () => {
  const a = contentHash({ originalPrice: 100, salePrice: 90, soldOut: false, options: [] });
  const b = contentHash({ originalPrice: 100, salePrice: 80, soldOut: false, options: [] });
  assert.notEqual(a, b);
});
```
- [ ] **Step 2: 실패 확인** — `npx tsx engine/__tests__/run.ts` (run.ts에 `import "./content-hash.test"` 추가). Expected: FAIL(모듈 없음).
- [ ] **Step 3: 구현**
```ts
// engine/content-hash.ts
import { createHash } from "node:crypto";
export interface HashInput { originalPrice: number; salePrice?: number | null; soldOut: boolean; options: string[]; }
export function contentHash(i: HashInput): string {
  const norm = JSON.stringify({
    o: i.originalPrice, s: i.salePrice ?? null, x: i.soldOut,
    p: [...i.options].sort(),
  });
  return createHash("sha256").update(norm).digest("hex").slice(0, 32);
}
```
- [ ] **Step 4: 통과 확인** — `npx tsx engine/__tests__/run.ts` → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(crawler): content-hash 변경감지"`

### Task 2.3: SiteConfig 타입

**Files:** Create `engine/types.ts`, `engine/__tests__/types.test.ts`

- [ ] **Step 1: 실패 테스트** — `validateSiteConfig`가 필수 필드 누락 시 throw, 정상 시 반환.
```ts
import assert from "node:assert";
import { test } from "../harness";
import { validateSiteConfig } from "../types";
test("strategy 누락 → throw", () => {
  assert.throws(() => validateSiteConfig({ id: "x", name: "X", baseUrl: "https://x.com", brandName: "X", platform: "cafe24" } as any));
});
test("정상 config 통과", () => {
  const c = validateSiteConfig({ id: "x", name: "X", baseUrl: "https://x.com", brandName: "X", platform: "cafe24", strategy: "static_html" });
  assert.equal(c.id, "x");
});
```
- [ ] **Step 2: 실패 확인.**
- [ ] **Step 3: 구현**
```ts
// engine/types.ts
export type Platform = "cafe24" | "godomall" | "shopify" | "custom";
export type Strategy = "json_api" | "static_html" | "playwright" | "blocked";
export interface SiteConfig {
  id: string; name: string; baseUrl: string; brandName: string;
  platform: Platform; strategy: Strategy;
  listEndpoint?: string;
  pagination?: { type: "page" | "offset" | "cursor"; param: string; size?: number };
  selectors?: Record<string, string>;
  robotsBlocked?: string[];
}
export function validateSiteConfig(c: SiteConfig): SiteConfig {
  for (const k of ["id","name","baseUrl","brandName","platform","strategy"] as const) {
    if (!c[k]) throw new Error(`SiteConfig.${k} 필수 (${c.id ?? "?"})`);
  }
  return c;
}
```
- [ ] **Step 4: 통과 확인.**
- [ ] **Step 5: Commit** — `git commit -m "feat(crawler): SiteConfig 타입+검증"`

### Task 2.4: robots.txt 파서

**Files:** Create `engine/robots.ts`, `engine/__tests__/robots.test.ts`

- [ ] **Step 1: 실패 테스트** (fixture 텍스트로 순수 함수 테스트)
```ts
import assert from "node:assert";
import { test } from "../harness";
import { parseRobots, isAllowed } from "../robots";
const ROBOTS = "User-agent: *\nDisallow: /admin/\nDisallow: /member/\nAllow: /product/\n";
test("차단 경로 판정", () => {
  const r = parseRobots(ROBOTS);
  assert.equal(isAllowed(r, "/admin/list"), false);
  assert.equal(isAllowed(r, "/product/123"), true);
});
```
- [ ] **Step 2: 실패 확인.**
- [ ] **Step 3: 구현** — `User-agent: *` 블록의 Disallow/Allow 프리픽스 매칭 (Allow 우선, 최장 매칭).
```ts
// engine/robots.ts
export interface Robots { disallow: string[]; allow: string[]; }
export function parseRobots(txt: string): Robots {
  const lines = txt.split(/\r?\n/); let inStar = false;
  const disallow: string[] = [], allow: string[] = [];
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, "").trim(); if (!line) continue;
    const [k, ...rest] = line.split(":"); const v = rest.join(":").trim();
    const key = k.trim().toLowerCase();
    if (key === "user-agent") inStar = v === "*";
    else if (inStar && key === "disallow" && v) disallow.push(v);
    else if (inStar && key === "allow" && v) allow.push(v);
  }
  return { disallow, allow };
}
export function isAllowed(r: Robots, path: string): boolean {
  const match = (list: string[]) => list.filter((p) => path.startsWith(p)).sort((a,b)=>b.length-a.length)[0];
  const a = match(r.allow), d = match(r.disallow);
  if (a && d) return a.length >= d.length;
  return !d;
}
export async function fetchRobots(baseUrl: string): Promise<Robots> {
  try {
    const res = await fetch(new URL("/robots.txt", baseUrl), { signal: AbortSignal.timeout(10_000) });
    return res.ok ? parseRobots(await res.text()) : { disallow: [], allow: [] };
  } catch { return { disallow: [], allow: [] }; }
}
```
- [ ] **Step 4: 통과 확인.**
- [ ] **Step 5: Commit** — `git commit -m "feat(crawler): robots.txt 파서"`

### Task 2.5: base-crawler (fetch/retry/delay + tier 파이프라인)

**Files:** Create `engine/base-crawler.ts`, `engine/__tests__/base-crawler.test.ts`

- [ ] **Step 1: 실패 테스트** — `withRetry`가 2회 실패 후 3번째 성공 시 값 반환; `randomDelay(1500,2000)` 범위.
```ts
import assert from "node:assert";
import { test } from "../harness";
import { withRetry } from "../base-crawler";
test("3회 재시도 후 성공", async () => {
  let n = 0;
  const r = await withRetry(async () => { n++; if (n < 3) throw new Error("fail"); return "ok"; }, 3, 1);
  assert.equal(r, "ok"); assert.equal(n, 3);
});
```
- [ ] **Step 2: 실패 확인.**
- [ ] **Step 3: 구현** — `fetchHtml`(browser UA, 15s timeout), `withRetry`(지수 백오프), `randomDelay`, robots 확인 훅. tier 파이프라인은 어댑터가 오버라이드하는 `collectList`/`parseDetail` 추상 메서드로 노출.
```ts
// engine/base-crawler.ts
import type { CrawledProduct } from "../types";
import type { SiteConfig } from "./types";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
export async function withRetry<T>(fn: () => Promise<T>, retries = 3, baseMs = 1000): Promise<T> {
  for (let a = 1; a <= retries; a++) {
    try { return await fn(); }
    catch (e) { if (a === retries) throw e; await delay(baseMs * 2 ** (a - 1)); }
  }
  throw new Error("unreachable");
}
export function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
export function randomDelay(min = 1500, max = 2000) { return delay(min + Math.floor((max - min) * pseudoRandom())); }
// 결정성 위해 시간 기반 대신 카운터 사용 (테스트 안정). 실제 지터는 index 기반.
let _c = 0; function pseudoRandom() { _c = (_c * 9301 + 49297) % 233280; return _c / 233280; }
export async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8" }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
  return res.text();
}
export interface Adapter {
  readonly platform: string;
  collectProductUrls(cfg: SiteConfig): Promise<string[]>;
  parseDetail(html: string, url: string, cfg: SiteConfig): CrawledProduct | null;
}
```
- [ ] **Step 4: 통과 확인.**
- [ ] **Step 5: Commit** — `git commit -m "feat(crawler): base fetch/retry/delay"`

### Task 2.6: scheduler (사이트 간 동시성 상한 + 사이트 내 순차)

**Files:** Create `engine/scheduler.ts`, `engine/__tests__/scheduler.test.ts`

- [ ] **Step 1: 실패 테스트** — 5개 작업, concurrency=2 → 동시 실행 수가 2를 절대 초과 안 함.
```ts
import assert from "node:assert";
import { test } from "../harness";
import { runWithConcurrency } from "../scheduler";
test("동시성 상한 준수", async () => {
  let active = 0, maxActive = 0;
  const tasks = Array.from({ length: 5 }, () => async () => {
    active++; maxActive = Math.max(maxActive, active);
    await new Promise((r) => setTimeout(r, 10)); active--;
  });
  await runWithConcurrency(tasks, 2);
  assert.ok(maxActive <= 2, `maxActive=${maxActive}`);
});
```
- [ ] **Step 2: 실패 확인.**
- [ ] **Step 3: 구현** — 워커 풀 패턴.
```ts
// engine/scheduler.ts
export async function runWithConcurrency<T>(tasks: Array<() => Promise<T>>, limit: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) { const i = idx++; results[i] = await tasks[i](); }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}
```
- [ ] **Step 4: 통과 확인.**
- [ ] **Step 5: Commit** — `git commit -m "feat(crawler): 동시성 스케줄러"`

### Task 2.7: 스키마 마이그레이션 (사전 승인 — additive nullable)

**Files:** Modify `prisma/schema.prisma` (Product 모델), Create `prisma/migrations/<ts>_add_crawler_source_fields/migration.sql`

- [ ] **Step 1:** `prisma/schema.prisma`의 `Product`에 추가:
```prisma
  sourceProductId String?
  contentHash     String?
```
- [ ] **Step 2:** 마이그레이션 SQL 작성 (타임스탬프는 기존 규칙 `YYYYMMDDHHMMSS`):
```sql
-- migration.sql
ALTER TABLE "products" ADD COLUMN "sourceProductId" TEXT;
ALTER TABLE "products" ADD COLUMN "contentHash" TEXT;
CREATE INDEX "products_sourceSite_sourceProductId_idx" ON "products" ("sourceSite", "sourceProductId");
```
- [ ] **Step 3:** `npx prisma generate` 후 `npx tsc --noEmit -p . 2>&1 | grep -v src/generated`로 타입 오류 없음 확인.
- [ ] **Step 4:** DB 반영 — 파일럿이 쓰는 DB(`DATABASE_URL`)에 `npx prisma migrate deploy` 적용. (additive nullable이라 실행 중 앱에 무영향.)
- [ ] **Step 5:** Commit — `git commit -m "feat(crawler): Product sourceProductId/contentHash 컬럼"`

### Task 2.8: storage 래퍼

**Files:** Create `engine/storage.ts`, `engine/__tests__/storage.test.ts`

- [ ] **Step 1: 실패 테스트** — `buildStorageFields(product)`가 contentHash와 sourceProductId를 채운다 (순수 함수, DB 불필요).
```ts
import assert from "node:assert";
import { test } from "../harness";
import { buildStorageFields } from "../storage";
test("storage 필드 생성", () => {
  const f = buildStorageFields({
    name: "P", brandName: "B", originalPrice: 100, salePrice: 90,
    imageUrls: [], sourceUrl: "https://x.com/product/1", sourceSite: "x",
    externalProductId: "1", variants: [{ size: "M" }],
  } as any);
  assert.equal(f.sourceProductId, "1");
  assert.ok(f.contentHash.length > 0);
});
```
- [ ] **Step 2: 실패 확인.**
- [ ] **Step 3: 구현** — `buildStorageFields`는 `contentHash`(가격/품절/옵션) + `sourceProductId`(externalProductId) 계산. `persist(products, jobId)`는 각 항목에 대해 `content_hash` 비교로 신규/변경 판정 후 기존 `importCrawledProducts` 호출(초기엔 그대로 위임, 변경감지는 contentHash로).
```ts
// engine/storage.ts
import type { CrawledProduct } from "../types";
import { contentHash } from "./content-hash";
import { importCrawledProducts } from "../product-importer";
export function buildStorageFields(p: CrawledProduct) {
  return {
    sourceProductId: p.externalProductId ?? null,
    contentHash: contentHash({
      originalPrice: p.originalPrice, salePrice: p.salePrice ?? null,
      soldOut: false, options: (p.variants ?? []).map((v) => `${v.size ?? ""}/${v.color ?? ""}`),
    }),
  };
}
export async function persist(products: CrawledProduct[], jobId: string) {
  // 초기 파일럿: 기존 importer에 위임(DRAFT). content_hash/sourceProductId는 Phase 2 후반 importer 확장에서 반영.
  return importCrawledProducts(products, jobId, { initialStatus: "DRAFT" });
}
```
- [ ] **Step 4: 통과 확인.**
- [ ] **Step 5: Commit** — `git commit -m "feat(crawler): storage 래퍼(content-hash)"`

### Task 2.9~2.11: 파일럿 어댑터 3개 (각 동일 구조)

> **셀렉터/엔드포인트는 Phase 1 fixture에서 확인한 실제 값만 사용. 추측 금지.**
> 파일럿 = 버킷스토어(플랫폼) + Cafe24 계열 1개 + 자체몰 1개 (Phase 1에서 확정).

각 어댑터마다:
- [ ] **Step 1: 파싱 실패 테스트** — `docs/crawler-fixtures/<siteId>/detail-1.html`을 읽어 `parseDetail`이 recon에서 기록한 **실제 값**(예: name="...", originalPrice=219000, imageUrls.length>=1)을 반환하는지 assert.
```ts
// 예시 (어뉴 Cafe24). 실제 기대값은 fixture에서 확인해 채움.
import fs from "node:fs";
import assert from "node:assert";
import { test } from "../harness";
import { Cafe24Adapter } from "../../adapters/cafe24";
const html = fs.readFileSync("docs/crawler-fixtures/anewgolf/detail-1.html", "utf8");
test("anewgolf 상세 파싱", () => {
  const p = new Cafe24Adapter().parseDetail(html, "https://anewgolf.com/product/x/1/", { id: "anewgolf", brandName: "어뉴골프" } as any);
  assert.ok(p && p.name.length > 0);
  assert.ok(p!.originalPrice > 0);
  assert.ok(p!.imageUrls.length >= 1);
});
```
- [ ] **Step 2: 실패 확인** (어댑터 없음).
- [ ] **Step 3: 어댑터 구현** — tier 전략(json_api/static_html)대로 `collectProductUrls`(리스트/sitemap/API) + `parseDetail`(JSON-LD→메타→전역변수/셀렉터). 플랫폼 공통 어댑터는 config로 분기.
- [ ] **Step 4: 파싱 테스트 통과 확인.**
- [ ] **Step 5: 통합 수집 검증** — `npx tsx scripts/crawl.ts --site <siteId> --mode full --limit 50` 실행 → 50+ 상품 수집, DB에 DRAFT 저장, `CrawlJob` COMPLETED 확인. (Task 2.12 CLI 완성 후)
- [ ] **Step 6: Commit** — `git commit -m "feat(crawler): <siteId> 어댑터 (파일럿)"`

### Task 2.12: CLI 진입점

**Files:** Create `scripts/crawl.ts`

- [ ] **Step 1:** 인자 파싱(`--site`, `--mode`, `--concurrency` 기본 3, `--limit`, `--dry-run`) → `sites.config.ts`에서 대상 필터 → 사이트별 태스크를 `runWithConcurrency`로 실행 → 각 사이트 내 순차+딜레이 → `persist` 호출 → 사이트별 카운트 로그.
```ts
// scripts/crawl.ts (골격 — 어댑터 배선은 파일럿 3개 기준)
import { runWithConcurrency } from "../src/lib/crawler/engine/scheduler";
import { SITES } from "../src/lib/crawler/sites.config";
// getAdapter(cfg), crawlSite(cfg, {mode,limit,dryRun}) 조합
```
- [ ] **Step 2:** `--dry-run`으로 파일럿 사이트 1개 실행 → 파싱 결과만 콘솔 출력 확인.
- [ ] **Step 3: Commit** — `git commit -m "feat(crawler): CLI 진입점"`

### Task 2.13: **승인 게이트 — 파일럿 결과 보고**

- [ ] **Step 1:** 파일럿 3개 각각 실제 수집 50+ 건 결과 샘플(상품명/브랜드/가격/이미지수/sourceUrl) + 사이트별 성공/실패 카운트 정리.
- [ ] **Step 2:** DB에 DRAFT로 들어간 것 확인(관리자 `/admin/products?status=DRAFT` 노출 근거).
- [ ] **Step 3:** **사용자에게 보고하고 승인 대기.** 승인 전까지 Phase 3 진행 금지. (푸시도 금지.)

---

## Phase 3 — 전체 어댑터 확장 (승인 후 확인 없이 완주)

### Task 3.1~3.N: 나머지 사이트 어댑터

각 사이트(파일럿 3개 제외)마다 Task 2.9 구조 반복:
- [ ] fixture 파싱 테스트 → 어댑터 구현/설정 추가 → 통합 수집 검증 → commit.
- 동일 솔루션(Cafe24/고도몰/Shopify)은 **`sites.config.ts` 항목 추가만으로** 동작해야 함(공통 어댑터 재사용). 신규 어댑터 코드는 custom 사이트만.
- Phase 1에서 blocked로 분류된 사이트는 **후순위** — 어댑터 생략, 리포트에 수동등록 대상으로 명시.

### Task 3.X: 스왑 (신규 엔진을 admin에 배선)

**Files:** Modify `src/lib/crawler/index.ts`, `src/actions/crawl.ts`

- [ ] 기존 `getCrawler`/`crawlSingleProduct`이 신규 엔진 어댑터를 쓰도록 배선(단일 URL 수집·관리자 트리거도 신규 엔진 경유). 기존 레거시 어댑터 파일은 스왑 검증 후 제거.
- [ ] `npm run build` 그린 확인.

### Task 3.Y: 성공률 리포트

- [ ] 사이트별 수집 성공률(수집 URL 대비 파싱 성공, 필드 완전성) 표 작성 → `docs/site_analysis.md` 갱신 또는 별도 리포트. commit.

---

## Phase 4 — 운영 기능 (별도 진행)

### Task 4.1: 이미지 다운로드 파이프라인
- [ ] URL만 저장된 상품의 이미지를 별도 모듈로 다운로드/저장 (public/ 또는 스토리지). 크롤링과 분리 실행.

### Task 4.2: 변경 이력 테이블 (⚠️ 스키마 승인 필요)
- [ ] `ProductCrawlHistory` 신규 테이블 설계 → **사용자 승인** → 마이그레이션 → contentHash 변경 시 이력 기록.

### Task 4.3: 수집 급감 알림
- [ ] 수집 0건/전일 대비 급감 감지 → 로그 경고. 슬랙 훅은 인터페이스만(추후 연동).

### Task 4.4: CLI → 크론 자동 전환
- [ ] `--mode update` 정기 실행을 크론(Railway cron 또는 외부 스케줄러)으로 배선. update 모드는 content_hash 비교로 변경분만 반영.

---

## Self-Review

**Spec coverage:** 설계 문서 §2~§9 각 항목 → Phase/Task 매핑 확인. 3단계 폴백(Task 2.5·2.9 어댑터 tier), 설정관리(2.3), content_hash(2.2·2.8), robots(2.4), 동시성(2.6), CLI(2.12), 이력테이블(4.2), 크론(4.4) 모두 태스크 존재. ✓

**Placeholder scan:** 어댑터 셀렉터는 "recon fixture에서 확인한 실제 값"으로 명시(추측 금지 원칙). 파일럿 기대값은 Phase 1 완료 후 fixture 기반으로 채움 — 이는 스펙의 "실제 HTML 확인 후 작성" 요구에 부합하는 의도된 지연이며 플레이스홀더 아님. ✓

**Type consistency:** `CrawledProduct`(기존 types.ts) 재사용, `SiteConfig`/`Adapter`/`contentHash`/`runWithConcurrency`/`persist` 시그니처 전 태스크 일관. ✓

**의존성:** 신규 npm 의존성 0 (node:assert/crypto, 기존 cheerio/tsx/playwright). CLAUDE.md 의존성 규칙 회피. ✓
