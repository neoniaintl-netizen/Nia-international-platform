# NOVAREN 크롤러 운영 매뉴얼 (1페이지)

> 기준: **GitHub Actions 버튼 실행**. 터미널 명령은 [부록](#부록-터미널-명령-로컬-실행)으로만 사용.
> 크롤 결과는 항상 **DRAFT**로 저장 → 관리자 검수 후 ACTIVE로 노출.

---

## 0. 최초 1회 설정 (Secrets)

GitHub 리포 → **Settings → Secrets and variables → Actions → New repository secret**:

| 이름 | 값 | 필수 |
|---|---|---|
| `PROD_DATABASE_URL` | 프로덕션 Postgres 연결 문자열 | ✅ 필수 |
| `SLACK_WEBHOOK_URL` | 급감/0건 알림용 슬랙 웹훅 | 선택 |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` / `R2_PUBLIC_URL` | 이미지 자체 스토리지(R2) | 선택 |

---

## 1. 크롤 실행 (Actions 버튼)

**GitHub → Actions 탭 → 왼쪽 "crawl" → 오른쪽 "Run workflow"** → 입력값 선택 → **Run workflow** 초록 버튼.

| 입력값 | 옵션 | 설명 |
|---|---|---|
| **site** | `pilot` / `all` / 개별(markandlona…) | `pilot` = 파일럿 3개(마크앤로나·어뉴·사우스케이프) |
| **mode** | `full` / `update` | full=전체 재수집, update=변경분만(가격/품절 바뀐 것만) |
| **limit** | 숫자(기본 50) | 사이트당 최대 수집 수 |

- ✅ **첫 프로덕션 크롤 = site: `pilot`, mode: `full`, limit: `50`** 으로 실행.
- 이상 없으면 site: `all` 로 전체 실행.
- 실행 로그는 Actions 실행 화면에서 실시간 확인. 사이트별 `수집 N → import M (skip S)` 출력, 이상 시 `⚠️ 급감/0건` 경고.

---

## 2. 검수 절차 (관리자 화면)

1. **`/admin/drafts` 접속** (관리자 로그인 필요).
2. 상단 **"사이트별 DRAFT 수"** 칩에서 크롤 결과 확인 (예: `markandlona 50`). ← 터미널 쿼리 불필요.
3. **필터**(사이트/브랜드/가격) 로 대상 좁힘 → 체크박스 선택.
4. **"선택 N개 → ACTIVE 승격"** 클릭 → 프론트에 노출됨. (잘못 수집분은 **"선택 N개 삭제"**)
5. 프론트(`/products` 또는 브랜드 페이지)에서 노출 확인.

> 승격·삭제 모두 **DRAFT만** 대상(안전가드). ACTIVE 상품은 이 화면에서 안 지워짐.

---

## 3. 정기 자동화 (크론 활성화)

`.github/workflows/crawl.yml` 의 `schedule:` 블록 주석 해제 → 커밋/푸시:
- 매일 **03:00 KST full**, **12:00 KST update** 자동 실행.
- 활성화 전까지는 수동(버튼)만 동작.

---

## 4. 장애 시 확인 지점

| 증상 | 확인 |
|---|---|
| 수집 0건 / 전일 대비 급감 | Actions 로그의 `⚠️` 경고. `/admin/drafts` 사이트별 카운트 비교 |
| 특정 사이트만 0건 | 해당 사이트 차단/구조 변경 가능 → [커버리지 문서](crawler-coverage-report.md) 확인 |
| 상품 이미지가 원 사이트 핫링크로 남음 | 이미지 로컬라이즈 미실행 → 아래 5번 |
| 풋조이 등 "불가" 브랜드 | 자동 불가(410 차단) → 운영자 수동 등록 |
| Playwright 대기 브랜드 | 타이틀리스트·버킷스토어 등 tier-3 미구현 → 별도 트랙 |

---

## 5. 이미지 로컬라이즈 (선택)

크롤은 원본 이미지 **URL만** 저장합니다. 자체 스토리지로 옮기려면(R2 Secrets 설정 후) crawl.yml의 `Localize images` 스텝 주석 해제. 로컬 실행은 부록 참조.

---

## 부록: 터미널 명령 (로컬 실행)

> Actions 대신 로컬에서 직접 돌릴 때만. 프로덕션 대상이면 `DATABASE_URL`에 프로덕션 URL 지정.

```bash
# 파일럿 3개, 50건씩
DATABASE_URL="<prod_url>" npx tsx scripts/crawl.ts --site pilot --limit 50

# 전체 / 개별 / 변경분만
DATABASE_URL="<prod_url>" npx tsx scripts/crawl.ts --site all --mode update
DATABASE_URL="<prod_url>" npx tsx scripts/crawl.ts --site malbon --limit 50

# 이미지 로컬라이즈 (R2 env 또는 로컬 FS)
DATABASE_URL="<prod_url>" npx tsx scripts/localize-images.ts --site all

# 테스트
npx tsx src/lib/crawler/engine/__tests__/run.ts
```
