# NKBUS 플랫폼 목적 (작업 시 우선 참고)

## 사이트 정체성

- **상호명**: 니아인터내셔널
- **서비스명**: NKBUS (엔큐버스)
- **대표자**: 윤지언
- **사업자등록번호**: 291-81-0245
- **통신판매업**: 2022-서울 강남-0
- **소재지**: 서울특별시 강남구 논현로102길 5(역삼동) 4층
- **고객센터**: 1544-7199 / 평일 09:00 ~ 18:00 (점심 12:00 ~ 13:00)
- **사업 형태**: 한국·해외 골프 브랜드 의류·신발·모자·액세서리 구매대행 + 직판 e-commerce
- **production URL**: https://nkbus-production.up.railway.app/
- **GitHub repo**: https://github.com/hamudo271/NKBUS

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

- **PG**: PortOne(아임포트) V2 도입 예정 — 심사 준비 중
- 결제수단: 카드, 카카오페이, 네이버페이, 토스페이, 가상계좌, 알리페이/위챗페이 (해외)
- 결제대행 위탁: PortOne (주식회사 아임포트)
- 안전거래: 우리은행 채무지급보증
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
