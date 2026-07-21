-- 추천 코디: 룩북 확장 (신규 테이블 없음, additive nullable)
ALTER TABLE "lookbooks" ADD COLUMN "kind" TEXT;
ALTER TABLE "lookbook_products" ADD COLUMN "role" TEXT;
