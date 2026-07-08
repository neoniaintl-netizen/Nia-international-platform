-- AlterTable: 크롤링 상품 식별/변경감지 필드 (additive nullable)
-- sourceProductId: 원본 사이트 상품 ID (sourceSite + sourceProductId 로 식별)
-- contentHash: 가격+품절+옵션 해시. 재크롤 시 동일하면 skip, 다르면 update.
ALTER TABLE "products" ADD COLUMN "sourceProductId" TEXT;
ALTER TABLE "products" ADD COLUMN "contentHash" TEXT;

-- CreateIndex
CREATE INDEX "products_sourceSite_sourceProductId_idx" ON "products" ("sourceSite", "sourceProductId");
