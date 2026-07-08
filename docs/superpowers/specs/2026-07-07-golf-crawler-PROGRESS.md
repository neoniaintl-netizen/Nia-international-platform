# 골프웨어 크롤러 재구축 — 진행 상태 (RESUME 파일)

> **다음 세션 재개법:** "Phase 3 이어서"만 입력하면 이 파일을 읽고 이어서 진행.
> 참고 문서: [설계](2026-07-07-golf-crawler-rebuild-design.md) · [계획](../plans/2026-07-07-golf-crawler-rebuild.md) · [정찰](../../site_analysis.md)
> 최종 갱신: 2026-07-07 (Phase 3 착수 시점)

## 현재 위치
- **Phase 1 ✅ 완료** (정찰, site_analysis.md, 파일럿 3개 확정)
- **Phase 2 ✅ 완료·승인됨** (코어 엔진 + 파일럿 3개 어댑터 + CLI, 124건 DRAFT 저장 검증)
- **Phase 3 🔄 진행 중** ← 지금 여기
- Phase 3+1: contentHash 마이그레이션 (Phase 3 완료 직후 첫 작업, 아래 조건2)
- Phase 4: 운영 기능 (이미지 파이프라인·이력테이블·알림·크론)

## 사용자 지정 조건 (반드시 준수)
1. **관리자 DRAFT 일괄 처리 기능**을 Phase 3에 포함: 브랜드/사이트/가격조건 필터 → bulk ACTIVE 승격 + bulk 삭제.
2. **contentHash 마이그레이션 = Phase 3 완료 직후 첫 작업.** 그 전에 로컬 미적용 마이그 3개 처리방안 보고(아래 완료).
3. **성공률 리포트에 "브랜드 커버리지" 열 추가.** 버킷스토어 이연으로 빠지는 3개 브랜드(세인트앤드류스·마스터바니·파리게이츠) 명시.
- **재개성**: 어댑터 1개 완성마다 로컬 커밋 + 이 파일 갱신. 푸시는 지시 전까지 금지.

## 로컬 미적용 마이그레이션 조사 결과 (조건 2 사전보고 — 완료)
- **정체**: 3개 모두 결제/환불 하드닝 마이그레이션(직전 작업 스트림). 전부 additive nullable.
  - `20260603222550_add_payment_fx_fields`: payments.pgCurrency/pgAmount/fxRate
  - `20260609100000_add_payment_debug_fields`: payments.pgRaw/refundRaw
  - `20260704000000_add_refund_reconcile_fields`: payments.refundedAt, orders.reconcileNote
- **로컬 DB 상태**: 해당 컬럼 전부 **없음 = 드리프트 아님** (information_schema 확인).
- **처리방안**: `npx prisma migrate deploy` 한 번으로 3개 깨끗이 적용 가능(안전, 무데이터손실). 그 후 contentHash 마이그 추가·적용. → **Phase 3 완료 직후 실행.**

## 어댑터 상태
| 사이트 | 브랜드 | 플랫폼 | 방식 | 상태 |
|---|---|---|---|---|
| markandlona | 마크앤로나 | shopify | json_api | ✅ Phase2 |
| anewgolf | 어뉴골프 | cafe24 | sitemap→상세 | ✅ Phase2 |
| southcape | 사우스케이프 | godomall | 리스트→상세 | ✅ Phase2 |
| utaa | 유타 | cafe24 | config 재사용 | ✅ T1 (img 1건-og만) |
| pelt | 펠트 | cafe24 | config 재사용 | ✅ T1 (img 9건) |
| iceberg | 아이스버그 | cafe24(sitemap無) | 카테고리 listEndpoint | ✅ T2 (cate_no=73, 19건/카테고리) |
| thecart | 더카트 | 자체(검증필요) | 상세 recon 후 | ⬜ 대기 |
| malbon | 말본 | 자체(cafe24추정) | 상세 recon 후 | ⬜ 대기 |
| titleist | 타이틀리스트 | 자체(cafe24추정) | 상세 recon 후 | ⬜ 대기 |
| amazingcre | 어메이징크리 | custom(JSON-LD) | GenericAdapter | ✅ T3 (sitemap→shop_view) |
| descentegolf | 데상트골프 | custom(ProductGroup) | GenericAdapter | ✅ T3 (홈→product) |
| pxg | PXG | 자체(.asp, og만) | 커스텀 가격 필요 | ⬜ 시도중 |
| malbon | 말본 | 자체(/shop/detail, og만) | 커스텀 가격 필요 | ⬜ 시도중 |
| titleist | 타이틀리스트 | 자체(URL형식 미확정) | 재확인 필요 | ⬜ 대기 |
| thecart | 더카트 | 자체(상품 sitemap無) | 후순위 검토 | ⬜ 대기 |
| footjoy | 풋조이 | shopify(상품 410 차단) | **차단→후순위** | ⏸️ 이연 |
| **후순위(playwright/SPA)** | bucketstore·gfore·랑방블랑·왁·nikegolf·bossgolf | — | Phase 3 제외, 리포트에 수동등록 명시 | ⏸️ 이연 |

## Phase 3 태스크 체크리스트
- [x] T1: Cafe24 config 재사용 — utaa, pelt ✅ (dry-run 검증 완료)
- [x] T2: iceberg — sitemap 없음, 카테고리 listEndpoint로 상품 URL 수집 (Cafe24Adapter 보강 or config)
- [ ] T3: 자체몰 recon+어댑터 — thecart/malbon/titleist/amazingcre/descentegolf/pxg (사이트당: 상세 fixture 캡처→plat 판별→어댑터/셀렉터→dry-run 검증→커밋)
- [ ] T4: footjoy — Shopify JSON-LD 폴백 어댑터
- [ ] T5: 관리자 DRAFT 일괄 처리 기능 (조건1) — 필터+bulk ACTIVE/삭제
- [ ] T6: 엔진을 /admin/crawl·src/actions/crawl.ts에 스왑 배선 + build 그린
- [ ] T7: 성공률 리포트 (브랜드 커버리지 열 포함, 조건3) → docs/site_analysis.md 갱신 or 신규
- [ ] T8: Phase 3 완료 보고 → (승인 후) Phase 3+1 contentHash 마이그

## 실행/검증 명령
```bash
# 테스트: npx tsx src/lib/crawler/engine/__tests__/run.ts
# 드라이런: npx tsx scripts/crawl.ts --site <id> --limit 5 --dry-run
# 실수집(로컬 DB DRAFT): npx tsx scripts/crawl.ts --site <id> --limit 50
# 타입: npx tsc --noEmit -p . 2>&1 | grep -v src/generated
```

## 핵심 파일
- 엔진: `src/lib/crawler/engine/{types,base-crawler,scheduler,robots,content-hash,storage}.ts`
- 어댑터: `src/lib/crawler/adapters/{shopify,cafe24,godomall,index}.ts`
- 설정: `src/lib/crawler/sites.config.ts`
- CLI: `scripts/crawl.ts`
- fixture: `docs/crawler-fixtures/<id>/` (대용량 recon은 gitignore, 파일럿 3개만 커밋)
- 저장: 로컬 DB(localhost:5432/musinsa_mvp)에 DRAFT. 프로덕션 반영은 운영자가 prod DATABASE_URL로 CLI 실행 시.

## 다음 액션
→ T1 (utaa, pelt Cafe24 config 추가) 부터.
