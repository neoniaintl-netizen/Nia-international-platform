# 크롤러 커버리지 · 성공률 리포트 (Phase 3)

> 작성: 2026-07-07 · 측정: `--site all --limit 20 --dry-run` 실제 라이브 수집
> 수집수 = 최대 20개 후보 URL 중 파싱 성공 건수 (하드 에러 0)

## 동작 어댑터 (9개 사이트)

| 사이트 | **브랜드 커버리지** | 플랫폼 | 전략/어댑터 | 수집@20 | 성공률 | 발견 방식 |
|---|---|---|---|---|---|---|
| markandlona | 마크앤로나 | Shopify | json_api | 20/20 | 100% | products.json |
| anewgolf | 어뉴골프 | Cafe24 | static_html | 20/20 | 100% | sitemap→상세 |
| utaa | 유타 | Cafe24 | static_html(config) | 20/20 | 100% | sitemap→상세 |
| pelt | 펠트 | Cafe24 | static_html(config) | 20/20 | 100% | sitemap→상세 |
| iceberg | 아이스버그 | Cafe24 | static_html(카테고리) | 12/20 | 카테고리 1개 한계 | 카테고리→상세 |
| southcape | 사우스케이프 | Godomall | static_html | 20/20 | 100% | 리스트→상세 |
| amazingcre | 어메이징크리 | Custom | Generic(JSON-LD) | 20/20 | 100% | sitemap→shop_view |
| descentegolf | 데상트골프 | Custom | Generic(ProductGroup) | 10/20 | 홈 1페이지 한계 | 홈→상세 |
| pxg | PXG | Custom | Generic(og+priceSelector) | 19/20 | 95% | apparel→view.asp |

- **파싱 하드 에러 0.** iceberg/descentegolf의 수집수가 낮은 건 파싱 실패가 아니라 **단일 리스트 진입점의 상품 수 한계** (다중 카테고리/페이지네이션 추가 시 증가) — Phase 4 개선 대상.
- Cafe24는 anewgolf 1개 어댑터로 4개 사이트 커버(설정만 추가). Generic(JSON-LD)은 3개 자체몰 커버.

## 이연 사이트 (미커버) + 사유

| 사이트 | 브랜드 | 사유 | 처리 |
|---|---|---|---|
| malbon | 말본 | 가격이 GA 애널리틱스 JS에만 존재(정적 요소 없음) | 커스텀 정규식 필요 → 후속 |
| titleist | 타이틀리스트 | 상품 상세 URL 형식 미확정(추정 404) | 재recon 필요 → 후속 |
| thecart | 더카트 | 상품 sitemap 없음·상품목록 진입점 불명 | 후속 recon |
| footjoy | 풋조이 | 상품 페이지 HTTP 410(차단/폐기) | **접근 불가** → 수동등록 |
| waac(코오롱몰) | 왁 | 대형몰 SPA·내부 API | tier-3 Playwright/수동 |
| gfore | 지포어 | SPA(홈에 Product 데이터 없음) | tier-3 Playwright/수동 |
| langvanblanc(더한섬) | 랑방블랑 | 브랜드 SPA | tier-3 Playwright/수동 |
| nikegolf | 나이키골프 | 강한 봇보호·골프 URL 리다이렉트 | 수동 |
| bossgolf | 보스골프 | 홈 12KB 셸(SPA 의심) | 재recon/수동 |
| **bucketstore** | **세인트앤드류스·마스터바니에디션·파리게이츠** | Next.js SPA·내부 API 미발견(런타임 로드) | **tier-3 Playwright** → 이 플랫폼 이연으로 3개 브랜드 미수집 |

## ⚠️ 버킷스토어 이연으로 빠지는 브랜드 (조건 3)

버킷스토어(bucketstore.com)는 **세인트앤드류스 · 마스터바니에디션 · 파리게이츠** 3개 브랜드를 입점 판매하는 플랫폼입니다.
이 사이트가 tier-3(Playwright)로 이연되면서 **위 3개 브랜드는 현재 자동 수집에서 빠집니다.** Playwright 경로(Phase 4) 또는 수동 등록 필요.

## 브랜드 커버리지 요약

- **목표 22개 브랜드 중 자동 수집 가능: 9개** (마크앤로나·어뉴골프·유타·펠트·아이스버그·사우스케이프·어메이징크리·데상트골프·PXG)
- **후속 가능(자체몰, 커스텀 작업 필요): 3개** (말본·타이틀리스트·더카트)
- **접근 불가/차단: 1개** (풋조이 410)
- **tier-3 Playwright/수동 대상: 9개** (왁·지포어·랑방블랑·나이키골프·보스골프 + 버킷스토어 입점 3개 브랜드[세인트앤드류스·마스터바니·파리게이츠])

## 다음 개선 (Phase 4 후보)
- 다중 카테고리/페이지네이션(iceberg·descentegolf·southcape 수집수 증대)
- Playwright tier-3 어댑터(버킷스토어·gfore·왁 등 SPA 커버)
- 이미지 다운로드 파이프라인, 변경 이력 테이블, 수집 급감 알림, 크론
