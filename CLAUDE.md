# NOVAREN (노바렌)

@AGENTS.md

한국 골프/스포츠/아웃도어/패션 상품을 중국 고객에게 판매하는 구매대행 쇼핑몰.

- **서비스명**: NOVAREN (노바렌) — 舊 NKBUS(엔큐버스)에서 리브랜딩됨
- **운영사**: (주)니아인터내셔널 / 대표 윤지언
- **Production**: https://kfashionly.com (Railway 프로젝트 "natural-friendship")
- **GitHub**: `neoniaintl-netizen/Nia-international-platform` (`git push origin main` → Railway 자동 배포)

## 기술 스택

Next.js 16 App Router · Auth.js v5 (credentials-only, 가입 시 전화번호 미수집) · Prisma 7 + PrismaPg (PostgreSQL on Railway, 컨테이너 시작 시 `prisma migrate deploy`) · next-intl **cookie 모드** KR/EN/CN (`NEXT_LOCALE` 쿠키, URL locale 라우팅 아님) · PG: Funpay/ICB(아이씨비) 알리페이·위챗페이

## 빌드/배포 필수 규칙

- **의존성 변경 시**: Railway는 node22/npm10. 로컬 npm(11)으로 만든 lockfile은 Railway `npm ci`를 깨뜨림.
  변경 후 반드시: `npx -y npm@10 install --package-lock-only` → `npx -y npm@10 ci --dry-run`으로 검증 후 커밋.
- **로컬 빌드**: `next build --webpack` 필수. 한글 폴더 경로(`노바렌`) 때문에 Turbopack이 panic함. package.json build 스크립트에 이미 반영됨.
- 배포 = `git push origin main`. 별도 배포 명령 없음.

## 절대 읽지 말 것 (토큰 낭비 방지)

- `src/generated/` — Prisma 자동 생성 코드 (index.d.ts가 7만 줄). **Read/Grep 모두 금지.** Grep은 반드시 `src/generated` 제외 경로로.
- `package-lock.json`, `tsconfig.tsbuildinfo`, `.next/`, `node_modules/`
- 스키마가 궁금하면 `prisma/schema.prisma`를 읽을 것.

## 보안/프로세스 제약

- 비밀번호·금융 정보 입력은 사용자가 직접 함. 대행하지 않는다.
- **DB 스키마 변경은 사용자 승인 필요.** 예외: additive nullable 컬럼 추가 마이그레이션은 사전 승인됨.
- Funpay/ICB `FUNPAY_SECRET_KEY`는 절대 로깅·노출 금지.
- 디버그 전용 코드(`Payment.pgRaw`, `Payment.refundRaw`, `/api/order-debug`, `/api/payment-config`)는 정식 런칭 전 제거 대상.
- 회원/관리자/결제(알리페이·위챗페이)/외부 API 연동 기능을 깨뜨리는 변경 금지 — 리팩토링 시 특히 주의.

## i18n 규칙

- 번역 파일: `messages/{ko,en,zh}.json`. 언어 스위처는 헤더 검색바 왼쪽.
- **상품명·DB 콘텐츠는 번역하지 않음** (영문 유지). UI 문자열만 번역.
- 다국어 작업은 페이지 단위로 점진적으로. 현재 완료: 헤더 + GNB + 푸터.

## 작업 스타일

- 존댓말로 응답.
- 과장 없는 정직한 진단 (안 되는 건 안 된다고).
- UI 변경은 스크린샷으로 검증 후 보고.
- 디자인은 프리미엄/에디토리얼 퀄리티 지향.

## 참고 문서

- `PLATFORM_PURPOSE.md` — 브랜드 목록, 크롤링 가능성 분석, 카테고리 구조, 과거 실패 사례(라운드로빈 매핑 금지 등)
- `DEPLOY.md` — Railway 초기 설정 가이드
