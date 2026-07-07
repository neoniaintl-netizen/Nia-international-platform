# 골프웨어 구매대행 크롤링 시스템 재구축 — 설계 문서

> 작성: 2026-07-07 · 대상: NOVAREN(kfashionly.com) 상품 공급 크롤러 재구축
> 상태: 설계 확정(사용자 승인 완료), Phase 1 착수 대기

---

## 1. 목표

골프웨어 브랜드 자사몰 ~18개 + 플랫폼 2개(더카트, 버킷스토어)에서 상품 데이터를 안정적으로 수집해,
**NOVAREN 관리자 페이지(`/admin/products?status=DRAFT`)에서 검수·승격 가능한 형태로 프로덕션 DB에 공급**한다.

핵심 요건: **수집 결과가 관리자 페이지에 그대로 반영될 것.**

---

## 2. 기술 결정 (사용자 승인 완료)

원래 제안된 Python 독립 스택 대신, **기존 TypeScript/Next.js/Prisma 스택 위에서 크롤러 레이어를 재구축**한다.
이유: "관리자 반영"이 필수 요건이고, 현재 리포에 이미 `product-importer`·`CrawlJob`·`/admin/crawl` 검수 플로우가 존재하므로 통합 비용이 가장 낮다. 스펙의 **설계 원칙**(어댑터 패턴, 3단계 폴백, 설정 기반 사이트 관리, content_hash 변경감지, robots/딜레이/재시도, 이력 테이블)은 그대로 이식한다.

| 항목 | 결정 |
|---|---|
| 언어/스택 | 기존 TypeScript (httpx→`fetch`/`undici`, BeautifulSoup→`cheerio`, Pydantic→TS 타입/zod, Playwright→`playwright`) |
| 실행 위치 | **앱 밖 CLI 배치** (`npx tsx scripts/crawl.ts`). Railway 프로덕션 컨테이너에서 무거운 배치·Playwright 안 돌림 |
| 저장 대상 | **Railway 프로덕션 Postgres (Prisma 스키마)**, status=DRAFT. 관리자가 검수 후 ACTIVE 승격 |
| 배치 구조 | 신규 크롤러 레이어를 **나란히 구축 후 교체**(build-alongside-then-swap). 검증 후 admin/API 배선 스왑 |
| 설정 관리 | **TS 설정 모듈** `sites.config.ts` (YAML 아님 — 파서 의존성 없이 타입 안전) |
| 동시성 | 사이트 **간 병렬(상한 있음, 기본 3 동시)** + 사이트 **내 순차** + 딜레이 1.5~2초 |
| Playwright | tier-3, **로컬 CLI에서만**. recon이 "JS 렌더 필요"로 판정한 사이트에만 배선 |

### 재사용 (변경 없음)
- `src/lib/crawler/product-importer.ts` — 브랜드 upsert, 카테고리 해석, DRAFT 저장, 이미지/변형/태그 생성
- `CrawlJob` 모델 — 수집 이력·상태(RUNNING/COMPLETED/FAILED) 추적
- `/admin/crawl`, `/admin/products?status=DRAFT` — 검수 UI

### 재구축 (새로)
- `BaseCrawler` 추상 클래스 + 사이트별 어댑터
- 3단계 폴백 수집 전략
- `sites.config.ts` 설정 기반 사이트 관리
- robots/딜레이/재시도/동시성 제어
- content_hash 기반 변경 감지

---

## 3. 실행 모델 (CLI)

진입점: `npx tsx scripts/crawl.ts`

```
--site all | <siteId>        # 대상 사이트 (기본 all)
--mode full | update         # full=전체 재수집 / update=변경분만(content_hash 비교)
--concurrency <n>            # 사이트 간 동시 실행 상한 (기본 3)
--limit <n>                  # 사이트당 최대 상품 수 (테스트/파일럿용)
--dry-run                    # DB 저장 없이 파싱 결과만 출력
```

- 사이트 간: `--concurrency` 상한 내 병렬. 사이트 내: 순차 + 1.5~2초 랜덤 딜레이.
- 요청 실패: 재시도 3회, 지수 백오프.
- 결과: 프로덕션 DB에 DRAFT로 INSERT/UPDATE + `CrawlJob` 기록.
- 로그: 사이트별 수집 시도/성공/실패/스킵 카운트 + 에러 로그.

---

## 4. 사이트 설정 (`sites.config.ts`)

동일 솔루션(Cafe24/고도몰/Shopify) 사이트는 **공통 어댑터 + 설정만으로** 동작.

```ts
interface SiteConfig {
  id: string;                 // "anewgolf"
  name: string;               // "어뉴골프"
  baseUrl: string;
  brandName: string;          // 강제 브랜드명 (메타에서 못 뽑는 경우 대비)
  platform: "cafe24" | "godomall" | "shopify" | "custom";
  strategy: "json_api" | "static_html" | "playwright";  // recon 결과 기록
  listEndpoint?: string;      // 상품 리스트 API/페이지 경로
  pagination?: { type: "page" | "offset" | "cursor"; param: string; size?: number };
  selectors?: Record<string, string>;  // custom/static_html용 (recon으로 검증한 실제 셀렉터)
  robotsBlocked?: string[];   // 준수할 차단 경로
}
```

`strategy` 필드는 Phase 1 정찰에서 "어떤 전략이 실제로 통하는지" 판별한 결과를 기록한다.

---

## 5. 어댑터 설계 — 3단계 폴백

`BaseCrawler.collect(config)` 흐름:
1. **tier-1 내부 JSON API** — 존재하면 최우선 (예: Shopify `/products.json`, Cafe24 상품 API). 가장 정확·빠름.
2. **tier-2 정적 HTML** — `fetch` + `cheerio`. JSON-LD → OpenGraph 메타 → 플랫폼 전역변수 순.
3. **tier-3 Playwright** — JS 렌더/봇 우회가 꼭 필요한 사이트만, **로컬에서만**.

각 어댑터는 파싱 결과를 공통 `CrawledProduct`(기존 [types.ts](src/lib/crawler/types.ts)) 형태로 반환 → `product-importer`가 DB 저장.

플랫폼 공통 어댑터: `Cafe24Adapter`, `GodomallAdapter`, `ShopifyAdapter`, `CustomAdapter`(사이트별 셀렉터).

---

## 6. 데이터 모델 / 변경 감지

### 유니크 키 & 변경 감지 (핵심 원칙 #3)
- 식별: **`sourceSite` + `sourceProductId`** 우선, 없으면 기존 `sourceUrl` 폴백.
- 변경 감지: **`contentHash`** = 해시(가격 + 품절 + 옵션). 신규 → INSERT, 해시 변경 → UPDATE.

### 스키마 변경
- **Phase 2~3 (사전 승인 범위):** `Product`에 additive nullable 컬럼 2개 추가
  - `sourceProductId String?`
  - `contentHash String?`
  - → CLAUDE.md "additive nullable 컬럼 마이그레이션 사전 승인" 해당.
- **Phase 4 (별도 승인 필요):** 가격/품절 변경 **이력 테이블** 신규 (예: `ProductCrawlHistory`) — 신규 테이블이므로 Phase 4 착수 시 스키마 승인 후 추가.

---

## 7. 준법 / 안정성 (스펙 금지사항 → 코드 가드)

- **robots.txt 파싱 후 차단 경로 준수.** 각 어댑터는 수집 전 robots 확인.
- **로그인 필요 영역 접근 금지.** 공개 상품 페이지(`/product/*` 등)만.
- **사이트당 초당 1회 초과 금지** — 사이트 내 순차 + 1.5~2초 딜레이로 보장.
- **셀렉터 추측 금지** — Phase 1 정찰에서 실제 HTML 확인 후에만 작성.
- 접근 불가/봇 차단 사이트는 사유를 `site_analysis.md`에 기록하고 수동 등록 대상으로 분류.

---

## 8. Phase 진행 (각 Phase 완료 후 사용자 확인)

### Phase 1 — 사이트 정찰 (코드 없음)
18개+ 사이트에 실제 `fetch`/curl 요청으로 다음 조사, `docs/site_analysis.md` 표로 정리:
- 플랫폼 종류, robots.txt 정책
- 상품 리스트 JSON API 존재/엔드포인트/페이지네이션
- JS 렌더 필요 여부, 봇 차단 여부
- 상품 필드 위치(가격/할인가/품절/옵션/이미지)
- → 각 사이트 `strategy` 판정. 접근 불가 사유 기록. **추측 금지, 실제 요청으로 검증.**

### Phase 2 — 코어 + 파일럿 3개
- core: `BaseCrawler`, storage(=importer 연동), scheduler(동시성/딜레이/재시도)
- 파일럿: 버킷스토어(플랫폼) + Cafe24 계열 1개 + 자체몰 1개
- 각 **50+ 상품 실수집 → DB 저장 검증 → 샘플 제시**

### Phase 3 — 전체 어댑터 확장
- 검증된 패턴으로 나머지 사이트 어댑터 작성
- 동일 솔루션은 `sites.config.ts` 설정 추가만으로 동작
- **사이트별 수집 성공률 리포트**

### Phase 4 — 운영 기능
- 이미지 다운로드/저장 파이프라인 (별도 모듈)
- 가격/품절 변경 감지 + **이력 테이블**(스키마 승인)
- 수집 0건/전일 대비 급감 시 알림(로그 → 추후 슬랙 훅)
- CLI 완성 (`--mode full|update`)
- **CLI → 크론 자동 전환** (정기 자동 수집. Railway cron 또는 외부 스케줄러, update 모드)

---

## 9. 범위 밖 / 유의

- **상품명·브랜드명 등 DB 콘텐츠는 번역하지 않음** (기존 i18n 규칙).
- **브랜드 × 타입 라운드로빈 매핑 금지** (PLATFORM_PURPOSE.md 과거 롤백 사례) — 1:1 매핑 또는 placeholder만.
- **결제/회원/관리자 기능을 깨뜨리지 않음** — 신규 레이어 나란히 구축 후 스왑.
- 크롤링 결과는 항상 **DRAFT**로 저장, 자동 공개(ACTIVE) 안 함 — 관리자 검수 필수.

---

## 10. 확정된 승인 사항

- [x] build-alongside-then-swap 접근
- [x] 설정을 TS 모듈로 (YAML 아님)
- [x] 이력 테이블은 Phase 4, content_hash 2개 컬럼은 Phase 2~3(사전 승인)
- [x] Phase 1 정찰(18개 외부 사이트 실제 HTTP 요청) 승인
- [x] 동시성 제한 (기본 3 동시, `--concurrency` 조절)
- [x] Phase 4에 CLI→크론 자동 전환 추가
