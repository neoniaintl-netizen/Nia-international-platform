# NOVAREN (노바렌)

한국 골프/스포츠/아웃도어/패션 상품을 중국 고객에게 판매하는 구매대행 쇼핑몰.
(주)니아인터내셔널 운영 · Production: https://kfashionly.com

## 스택

- Next.js 16 (App Router) + TypeScript
- Auth.js v5 (credentials)
- Prisma 7 + PostgreSQL (Railway)
- next-intl — KR/EN/CN, cookie 모드
- Funpay/ICB PG — 알리페이/위챗페이

## 로컬 개발

```bash
npm install
npx prisma generate
npm run dev        # http://localhost:3000
```

빌드는 `npm run build` (내부적으로 `next build --webpack` — 한글 폴더 경로 때문에 Turbopack 사용 불가).

환경 변수는 `.env.example` 참고. DB·인증은 `.env`, Funpay 결제는 `.env.local`.

## 배포

`git push origin main` → Railway 자동 배포 (node22/npm10).
**의존성 변경 시 lockfile을 npm 10으로 재생성해야 함** — 절차는 `CLAUDE.md` 참고.

## 문서

- `CLAUDE.md` — 작업 규칙 (빌드/배포 제약, 보안 규칙, i18n 정책)
- `PLATFORM_PURPOSE.md` — 사업 배경, 브랜드 목록, 크롤링 분석
- `DEPLOY.md` — Railway 초기 설정 가이드
