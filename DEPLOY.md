# Musinsa MVP - Railway 배포 가이드

## 사전 준비

- [Railway](https://railway.app) 계정
- GitHub 레포지토리에 코드 push 완료
- (선택) 카카오/네이버 소셜 로그인 키

---

## 1단계: Railway 프로젝트 생성

1. [railway.app](https://railway.app) 접속 후 로그인
2. **New Project** 클릭
3. **Deploy from GitHub repo** 선택 후 이 레포지토리 연결

---

## 2단계: PostgreSQL 데이터베이스 추가

1. 프로젝트 대시보드에서 **+ New** 클릭
2. **Database > PostgreSQL** 선택
3. 생성 완료 후, PostgreSQL 서비스 클릭 > **Variables** 탭에서 `DATABASE_URL` 확인
   - 형식: `postgresql://user:password@host:port/dbname`

---

## 3단계: 환경 변수 설정

Next.js 서비스 클릭 > **Variables** 탭에서 아래 변수들을 추가합니다:

### 필수
| 변수명 | 값 | 설명 |
|--------|-----|------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Railway 변수 참조 (자동 연결) |
| `AUTH_SECRET` | `openssl rand -base64 32` 로 생성 | NextAuth 시크릿 키 |
| `AUTH_URL` | `https://your-app.up.railway.app` | **반드시 Railway 도메인 그대로** (`.env`의 localhost 값이 절대 운영에 새지 않도록) |
| `NEXTAUTH_URL` | `https://your-app.up.railway.app` | AUTH_URL과 동일 |
| `NODE_ENV` | `production` | 프로덕션 모드 |

> Railway의 PostgreSQL 서비스에서 `DATABASE_URL`을 변수 참조(`${{Postgres.DATABASE_URL}}`)로 연결하면 자동으로 주입됩니다.
> `AUTH_URL` 값이 잘못되면 OAuth 콜백·CSRF·redirect가 조용히 깨집니다 — 도메인 변경 시 즉시 업데이트.

### PortOne(아임포트) V2 PG 결제
| 변수명 | 값 | 설명 |
|--------|-----|------|
| `NEXT_PUBLIC_PORTONE_STORE_ID` | PortOne 가맹점 식별코드 | 클라이언트에 노출되는 공개 값 |
| `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` | PortOne 채널 키 | 클라이언트에 노출되는 공개 값 |
| `PORTONE_API_SECRET` | PortOne API 시크릿 | **서버 전용**, 절대 NEXT_PUBLIC 접두 금지 |
| `PORTONE_WEBHOOK_SECRET` | PortOne webhook 시크릿 | webhook 콜백 HMAC 서명 검증용 |
| `NEXT_PUBLIC_PAYMENT_TEST_MODE` | `true` 또는 미설정 | staging은 `true`, 운영은 반드시 미설정 |

**Webhook URL 등록**: 배포 후 PortOne 콘솔 → 결제 연동 → Webhook 메뉴에서 다음 URL을 등록:
```
https://nkbus-production.up.railway.app/api/payment/webhook
```
서명 검증용 secret은 PortOne 콘솔에서 발급받아 `PORTONE_WEBHOOK_SECRET`에 설정. 키 로테이션 시 양쪽 모두 동시 업데이트.

### 어드민 / 운영 도구
| 변수명 | 값 | 설명 |
|--------|-----|------|
| `ADMIN_SETUP_TOKEN` | `openssl rand -hex 16` 으로 생성 | `/api/admin/setup` 호출 시 필요한 1회용 토큰. 부트스트랩 완료 후 Railway에서 즉시 제거 권장 |

### 소셜 로그인 (선택)
| 변수명 | 값 | 설명 |
|--------|-----|------|
| `AUTH_KAKAO_ID` | 카카오 앱 키 | 카카오 로그인 사용 시 |
| `AUTH_KAKAO_SECRET` | 카카오 시크릿 | 카카오 로그인 사용 시 |
| `AUTH_NAVER_ID` | 네이버 앱 키 | 네이버 로그인 사용 시 |
| `AUTH_NAVER_SECRET` | 네이버 시크릿 | 네이버 로그인 사용 시 |

### Rate Limiting (선택)
| 변수명 | 값 | 설명 |
|--------|-----|------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | 미설정 시 in-memory 폴백 (싱글 인스턴스만 보호) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST 토큰 | 위와 함께 |

## 어드민 부트스트랩 (1회)

최초 1회 어드민 계정을 생성/리셋하려면:

1. Railway에 `ADMIN_SETUP_TOKEN`을 임시로 설정 (예: `openssl rand -hex 16`)
2. ADMIN role을 가진 사용자 세션으로 다음 호출 (curl 또는 어드민 페이지에서)
   ```bash
   curl -X POST https://nkbus-production.up.railway.app/api/admin/setup \
     -H "x-admin-setup-token: <위에서 생성한 토큰>" \
     -H "Cookie: <ADMIN 세션 쿠키>"
   ```
3. 응답이 `{ ok: true, userId }` 면 성공
4. **Railway에서 `ADMIN_SETUP_TOKEN`을 즉시 삭제** (재호출 차단)

> 비밀번호/이메일은 응답에 절대 포함되지 않습니다. 기본 계정 `admin@nkbus.com`이 DB에 이미 있다면 비밀번호는 `nkbus1234!`로 리셋됩니다 — 로그인 후 즉시 변경 권장.

---

## 4단계: 빌드 & 배포 설정

Railway가 GitHub 연결 시 자동으로 감지하지만, 필요하면 서비스 **Settings** 에서 확인:

- **Build Command**: `npm run build` (= `prisma generate && next build`)
- **Start Command**: `npm run start`
- **Watch Paths**: `/` (기본값)

---

## 5단계: 데이터베이스 마이그레이션

배포가 완료된 후, Railway에서 마이그레이션을 실행합니다.

### 방법 A: Railway CLI 사용 (권장)

```bash
# Railway CLI 설치
npm install -g @railway/cli

# 로그인
railway login

# 프로젝트 연결
railway link

# 마이그레이션 실행
railway run npx prisma migrate deploy

# (선택) 시드 데이터 넣기
railway run npx prisma db seed
```

### 방법 B: Railway 대시보드에서 실행

1. 서비스 클릭 > **Settings** > **Deploy** 섹션
2. **Custom Start Command**에 한 번만 아래로 변경:
   ```
   npx prisma migrate deploy && npx prisma db seed && npm run start
   ```
3. 배포 완료 후 다시 `npm run start` 로 원복

---

## 6단계: 도메인 설정

1. 서비스 > **Settings** > **Networking** > **Generate Domain**
2. `xxxx.up.railway.app` 도메인이 생성됨
3. 이 도메인을 `AUTH_URL`과 `NEXTAUTH_URL` 환경변수에 업데이트
4. (선택) 커스텀 도메인 연결 가능

---

## 7단계: 소셜 로그인 콜백 URL 설정

카카오/네이버 소셜 로그인을 사용한다면:

### 카카오
- [developers.kakao.com](https://developers.kakao.com) > 앱 설정 > 카카오 로그인
- Redirect URI: `https://your-app.up.railway.app/api/auth/callback/kakao`

### 네이버
- [developers.naver.com](https://developers.naver.com) > 앱 설정
- Callback URL: `https://your-app.up.railway.app/api/auth/callback/naver`

---

## 배포 후 확인 체크리스트

- [ ] 홈페이지 접속 확인
- [ ] 상품 목록 로딩 확인
- [ ] 로그인/회원가입 동작 확인 (admin@test.com / test1234)
- [ ] 관리자 페이지 접속 확인 (/admin)
- [ ] 이미지 업로드 동작 확인

---

## 이미지 업로드 관련 참고

현재 이미지는 `public/uploads/`에 로컬 저장됩니다.
Railway는 **ephemeral filesystem** 이므로 재배포 시 업로드 이미지가 초기화됩니다.

### 프로덕션 권장: 외부 스토리지 연동
- **AWS S3** / **Cloudflare R2** / **Supabase Storage** 등 사용 권장
- 추후 `/api/upload/route.ts`에서 저장 경로만 변경하면 됩니다

---

## 문제 해결

### 빌드 실패: Prisma Client 생성 오류
```bash
# package.json에 이미 설정되어 있음
"build": "prisma generate && next build"
```

### DB 연결 오류
- `DATABASE_URL`이 올바르게 설정되었는지 확인
- Railway PostgreSQL 서비스가 실행 중인지 확인
- SSL 필요 시 URL 끝에 `?sslmode=require` 추가

### AUTH_URL 오류
- Railway 도메인 생성 후 반드시 `AUTH_URL` 환경변수 업데이트
- `https://` 프로토콜 포함 필수

---

## 비용 참고

Railway 무료 플랜 (Trial):
- 월 $5 크레딧 제공
- PostgreSQL + Next.js 서비스 운영 가능
- 트래픽이 적은 MVP 테스트에 충분

유료 플랜 (Hobby $5/월):
- 더 많은 리소스, 커스텀 도메인 등
