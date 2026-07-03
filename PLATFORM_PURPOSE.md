# NOVAREN 플랫폼 목적 (작업 시 우선 참고)

## 사이트 정체성

- **상호명**: (주)니아인터내셔널
- **서비스명**: NOVAREN (노바렌) — 舊 NKBUS(엔큐버스)에서 리브랜딩
- **대표자**: 윤지언
- **사업자등록번호**: 291-81-0245
- **통신판매업**: 2022-서울 강남-0
- **소재지**: 서울특별시 강남구 논현로102길 5(역삼동) 4층
- **고객센터**: 1544-7199 / 평일 09:00 ~ 18:00 (점심 12:00 ~ 13:00)
- **사업 형태**: 한국 골프/스포츠/아웃도어/패션 상품을 중국 고객에게 판매하는 구매대행 e-commerce
- **production URL**: https://kfashionly.com (Railway 프로젝트 "natural-friendship")
- **GitHub repo**: https://github.com/neoniaintl-netizen/Nia-international-platform

## 1차 카테고리 — **골프웨어** (최우선)

이 사이트의 핵심 카테고리이며, 다른 모든 작업의 기반.

### 우선 입점 22개 골프 브랜드 (운영자 지정)

#### 한국 정식 진출 / 한국 사이트 보유

| 브랜드 | 사이트 | 비고 |
|---|---|---|
| 더카트 | https://www.thecart.co.kr/ | 자체 시스템 (자동 크롤링 어려움) |
| 버킷스토어 | https://bucketstore.com/ | 멀티브랜드 셀렉트샵 |
| 말본골프 | https://malbongolfkorea.com/ | cafe24 추정 |
| 지포어 | https://www.gfore.kr/ | 자체 |
| 사우스케이프 | https://southcape.shop/ | godomall |
| 어메이징크리 | https://shop.amazingcre.com/ | cafe24 |
| 랑방블랑 | https://www.thehandsome.com/ko/DP/brandMain/BR63 | 핸섬 SPA |
| 세인트앤드류스 | https://bucketstore.com/brands/8 | 버킷스토어 입점 |
| 마스터바니에디션 | https://bucketstore.com/brands/4 | 버킷스토어 입점 |
| 파리게이츠 | https://bucketstore.com/brands/5 | 버킷스토어 입점 |
| 데상트골프 | https://dk-on.com/DESCENTEGOLF | 자체 |
| 피엑스지 (PXG) | https://www.pxg.co.kr/main/apparel.asp | 한국 사이트 SPA. 글로벌(www.pxg.com)은 Shopify |
| 어뉴골프 | https://anewgolf.com/ | cafe24 |
| 풋조이 | https://www.footjoy.co.kr/ | 한국 IP에서 봇 차단 (403) |
| 보스골프 | https://iamtom.co.kr/ | cafe24 |
| 마크앤로나 | https://markandlona-korea.co.kr/ | **Shopify** (products.json 직접 가능) |
| 왁골프 | https://www.kolonmall.com/Brands/WAAC | 코오롱몰 자체 |
| 아이스버그 골프 | https://iceberggolf.com/ | cafe24 |
| 유타 (UTAA) | https://utaagolf.com/ | cafe24 (sitemap → og:image 가능) |
| 펠트 | https://peltgolf.com/ | cafe24 |
| 타이틀리스트 | https://titleistapparel.co.kr/ | cafe24 |
| 나이키 골프 | https://www.nike.com/kr/w/golf-mens-clothing | Nike 자체 (selector 필요) |

### 카테고리 구조 (`golf-category-map.ts` 기준)

- `golf-top` — 상의 (셔츠/티/폴로/후드/니트 등)
- `golf-bottom` — 하의 (팬츠/스커트/반바지 등)
- `golf-outer` — 아우터 (자켓/패딩/플리스/베스트 등)
- `golf-shoes` — 골프화
- `golf-cap` — 모자/바이저
- `golf-bag` — 가방 (캐디백/카트백/보스턴 등)
- `golf-acc` — 액세서리 (장갑/벨트/양말/마커 등)
- `golf-club` — 클럽 (드라이버/아이언/웨지/퍼터 등)
- `golf-ball` — 골프공

## 2차 카테고리 (추후 단계)

골프웨어 작업 완료 후 진행:
1. **여성의류** (Alo Yoga, Nike SKIMS 등 sportswear 위주)
2. **아웃도어** (The North Face, Patagonia, Salomon, Arc'teryx 등)
3. **스포츠** (Wilson, DESCENTE 등)

## 결제·주문

- **PG**: Funpay/ICB(아이씨비) — 알리페이·위챗페이 공식 파트너 연동 (도입 완료, 알리페이 실결제 검증됨)
- 결제수단: 알리페이, 위챗페이 (위챗페이는 `FUNPAY_WECHAT_ENABLED` 활성화됨, 실결제 테스트 미완)
- 연동 방식: SHA-256 `fgkey` 서명, `payment.icb` POST, 취소는 `refund.icb`, notify 웹훅으로 PAID 확정
- (과거 PortOne/아임포트 도입 예정이었으나 Funpay/ICB로 변경됨)
- **결제 혜택**: 가입 후 첫 결제 시 5,000원 할인

## 작업 시 핵심 원칙

### DO

- ✅ **상품 데이터 정확도 우선** — 진짜 product 이름·이미지·가격·sourceUrl 가져오기
- ✅ **브랜드별 / 카테고리별 정합성** 유지 (자켓 product에 폴로 사진 박지 않기)
- ✅ **소스 1:1 매핑**: product.sourceUrl을 직접 fetch해 og:image / JSON-LD 추출이 가장 정확
- ✅ **운영자 어드민 등록을 default로 가정** — 자동화는 보조 수단
- ✅ **PG 심사용 사업자 정보·정책 페이지 정확히 유지**

### DON'T

- ❌ **brand 풀 라운드로빈 매핑 금지** — 자켓에 폴로 박는 등 카테고리 mismatch 부작용 발생함 (2026-05-10 ~ 11 시도, 사용자 요청으로 롤백)
- ❌ **start 스크립트에 destructive cleanup 넣기 금지** — 매 컨테이너 시작 시 자동 DB 변경은 hang 또는 잘못된 매핑 위험
- ❌ **자동 mismatch 검출 키워드 화이트리스트 공격적 모드 금지** — false positive로 정상 이미지를 placeholder로 reset
- ❌ **PG 심사 임박 시점에 광범위 보안/cleanup 변경 누적 금지** — production 안정성 우선

## 자동 크롤링 가능성 정리 (2026-05-11 시도 결과)

| 그룹 | 추출 방법 | 성공 brand | 비고 |
|---|---|---|---|
| **A. Shopify products.json** | `${origin}/products.json?limit=250` | markandlona, pxg(글로벌) | 가장 정확 |
| **B. Shopify sitemap_products** | sitemap.xml → image:loc + image:title | pxg(글로벌) | image+title 한 번에 |
| **C. cafe24 sitemap → og:image** | sitemap.xml의 /product/ URL → Playwright og:image | utaa, anew | og:title 다중일 때 product-specific 선택 |
| **D. SPA Playwright collection** | collection 페이지 + selector | nikegolf 일부 | 사이트마다 selector 다름 |
| **E. 자동 추출 어려움** | 수동 등록 권장 | thecart, gfore, southcape, malbon, iceberg, pelt, bossgolf, bucketstore, langvan, footjoy, descentegolf, amazingcre, titleist, waacgolf | 자체 시스템·SPA·봇 차단 |

## 추후 작업 가이드

1. **PG 심사 통과**가 최우선. 상품 데이터 정확도가 그 다음.
2. 상품 데이터는 **운영자 어드민 수동 등록**이 가장 정확. 자동 크롤링은 ~30~50% 보완.
3. cafe24 brand는 **sitemap → 각 product 페이지 og:image** 추출이 가장 robust (Playwright 필요).
4. 잘못된 데이터는 **placeholder로 reset 후 운영자 수동 교체** 워크플로우.
5. brand × type 풀 라운드로빈 매핑은 사용 금지. 1:1 매핑 또는 placeholder만.

## 변경 이력 (참고)

- `2026-05-09` 초기 사이트 운영 시작
- `2026-05-09 ~ 10` 대표자 이름 윤지현 → 윤지언 수정
- `2026-05-10 ~ 11` PG 심사용 보안 강화 / cleanup / 일괄 마이그 / Playwright 추출 시도 — 부작용으로 사용자 요청에 의해 롤백
- `2026-05-11` `3c032f4` (대표자 이름 수정 직후 시점)으로 코드 롤백 + 본 PLATFORM_PURPOSE.md 추가
- `2026-06월` NKBUS → NOVAREN 리브랜딩, kfashionly.com 도메인 연결, Funpay/ICB 결제 도입(알리페이 실결제 검증), next-intl KR/EN/CN 다국어(헤더·GNB·푸터)
- `2026-07-03` 본 문서를 리브랜딩 이후 정보로 갱신 (정체성/결제 섹션)
