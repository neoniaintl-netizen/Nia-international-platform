-- 승인제 회원: approvedAt 추가 (null=승인 대기)
ALTER TABLE "users" ADD COLUMN "approvedAt" TIMESTAMP(3);

-- 기존 회원 전원을 '승인 완료'로 백필 — 배포 시 현재 사용자가 잠기지 않도록.
-- (이후 신규 가입자만 approvedAt=null 로 승인 대기 상태가 된다)
UPDATE "users" SET "approvedAt" = now() WHERE "approvedAt" IS NULL;
