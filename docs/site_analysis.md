# 사이트 정찰 결과 (Phase 1)

> 작성: 2026-07-07 · 방법: `fetch`로 robots.txt + 홈페이지 + `/products.json` + sitemap + (파일럿) 상품 상세 실제 요청.
> 원본 응답은 `docs/crawler-fixtures/<siteId>/`에 저장(셀렉터 작성 근거). **추측 없이 실제 응답으로만 판정.**

## 요약 판정표

| # | 사이트 | id | 플랫폼 | robots | tier-1 API | JS렌더 | 봇차단 | **strategy** | 근거/필드 위치 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 버킷스토어 | bucketstore | Next.js 자체 | 404 | ✗(API 미발견) | **O** | 없음 | **playwright** | `__NEXT_DATA__` 없음, `/api/*` 추정 404. 런타임 API 필요 → 후순위 |
| 2 | 더카트 | thecart | 자체 | 200 | products.json soft-200 | ? | 없음 | static_html(검증필요) | sitemap에 상품 URL 존재. 상세 미캡처 |
| 3 | 말본 | malbon | 자체(대형 HTML) | 200 | ✗ | ? | 없음 | 검증필요 | sitemap/products.json 없음, 홈 1.35MB |
| 4 | 지포어 | gfore | 자체 SPA | 200 | ✗ | **O** | 없음 | **playwright** | 홈에 Product JSON-LD·상품링크 없음(ItemList만) → 후순위 |
| 5 | 사우스케이프 | southcape | **고도몰** | 200 | ✗ | 없음 | 없음 | **static_html ✓ 파일럿** | 리스트 `goods_list.php`→`goods_view.php?goodsNo=`, 상세 og:image+가격+품절 |
| 6 | 어메이징크리 | amazingcre | 자체 | 200 | ✗ | ? | 없음 | 검증필요 | JSON-LD 있음, sitemap 상품 URL 없음 |
| 7 | 랑방블랑 | langvanblanc | 더한섬 SPA | 200 | ✗ | **O** | 없음 | **playwright** | 브랜드 SPA → 후순위 |
| 8 | 데상트골프 | descentegolf | dk-on 자체 | 200 | ✗ | ? | 없음 | 검증필요 | JSON-LD 있음, 홈 732KB |
| 9 | PXG | pxg | 자체(.asp) | 200 | ✗ | ? | 없음 | 검증필요 | sitemap 상품 URL 존재 |
| 10 | 어뉴 | anewgolf | **Cafe24** | 200 | ✗ | 없음 | 없음 | **static_html ✓ 파일럿** | 상세에 product_name/price 전역변수 + JSON-LD Product + og:image + 품절 |
| 11 | 풋조이 | footjoy | Shopify(추정) | 200 | products.json **410**(비활성) | 없음 | 없음(현재 200) | static_html(JSON-LD) | JSON-LD 있음, sitemap_index. ※과거 한국IP 403 이력 → 재확인 필요 |
| 12 | 보스골프 | bossgolf | 자체(셸 12KB) | 404 | ✗ | **O 추정** | ? | 검증필요 | 홈 12.6KB 초소형 → SPA/스플래시 의심, 후순위 |
| 13 | 마크앤로나 | markandlona | **Shopify** | 200 | **products.json ✓** | 없음 | 없음 | **json_api ✓ 파일럿** | `/products.json?limit=250`, variants·29이미지·옵션·tags 완전 |
| 14 | 왁 | waac | 코오롱몰 자체 | 200 | products.json soft-200 | **O** | 없음 | **playwright** | 홈 2.4MB 대형몰, 내부 API/SPA → 후순위 |
| 15 | 아이스버그 | iceberg | **Cafe24** | 200 | ✗ | 없음 | 없음 | static_html | sitemap 404 → 카테고리 페이지 경유. Cafe24 어댑터 재사용 |
| 16 | 유타 | utaa | **Cafe24** | 200 | ✗ | 없음 | 없음 | static_html | sitemap→상품 URL ✓. Cafe24 어댑터 재사용 |
| 17 | 펠트 | pelt | **Cafe24** | 200 | ✗ | 없음 | 없음 | static_html | sitemap→상품 URL ✓. Cafe24 어댑터 재사용 |
| 18 | 타이틀리스트 | titleist | 자체(64KB) | 200 | ✗ | ? | 없음 | 검증필요 | sitemap 상품 URL 존재, 홈 64KB |
| 19 | 나이키골프 | nikegolf | Nike 글로벌 SPA | 200 | ✗ | **O** | **강함** | **playwright/blocked** | 골프 URL이 신발로 리다이렉트, 강한 봇보호 → 후순위 |

## 전략별 분류

- **json_api (tier-1) — 즉시 가능:** markandlona(Shopify products.json). footjoy는 products.json 410(비활성)이라 JSON-LD 폴백.
- **static_html (tier-2):**
  - Cafe24 공통 어댑터: **anewgolf, utaa, pelt, iceberg** (동일 어댑터 + sites.config 항목만으로 처리)
  - Godomall 공통 어댑터: **southcape**
  - 자체몰(검증 필요, Phase 3에서 상세 캡처 후 셀렉터 확정): thecart, pxg, titleist, descentegolf, amazingcre, malbon
- **playwright / 후순위 (JS 렌더·내부 API·봇보호):** bucketstore, gfore, langvanblanc, waac(코오롱몰), nikegolf, bossgolf

## 접근성 특이사항

- **봇차단 사이트 없음** (전 사이트 홈 200). 스펙 우려와 달리 풋조이도 현재 200 — 단, 과거 한국IP 403 이력 있어 대량 수집 시 재확인 필요.
- **bucketstore(스펙 최우선 플랫폼)** 는 Next.js SPA로 내부 API가 런타임에만 노출 → tier-3(Playwright) 필요. 정적 크롤 불가로 **후순위 재분류** (사용자 위임 사항 #2 적용).
- nikegolf는 봇보호 강함 + 골프 카테고리 리다이렉트 → 후순위.

## 파일럿 3개 선정 (Phase 2 대상)

서로 다른 플랫폼/전략을 커버해 코어 파이프라인을 최대한 검증:

1. **markandlona** — Shopify `json_api` (tier-1). `/products.json`로 50+ 즉시 확보. → ShopifyAdapter
2. **anewgolf** — Cafe24 `static_html`. sitemap→상세, 전역변수+JSON-LD. → Cafe24Adapter (utaa/pelt/iceberg 재사용)
3. **southcape** — Godomall `static_html`. 리스트→goodsNo→상세. → GodomallAdapter

> 스펙의 명시 플랫폼 파일럿이던 **버킷스토어는 tier-3라 Phase 3(Playwright)로 이연**하고, 파일럿 3번을 별도 플랫폼(고도몰) southcape로 대체. Phase 2 파일럿 게이트에서 최종 확인받음.

## 저장된 fixture

- 전 사이트: `home.html`, `robots.txt`, (있으면) `sitemap.xml`
- markandlona: `products.json` (실데이터 3건)
- anewgolf: `detail-1.html` (상품 상세)
- southcape: `detail-1.html` (상품 상세)
- bucketstore: `home.html` (SPA 판정 근거)
