-- AlterTable: PG 결제 통화/외화금액/환율 저장 (환불 시 pgAmount 사용)
ALTER TABLE "payments" ADD COLUMN     "pgCurrency" TEXT,
ADD COLUMN     "pgAmount" DECIMAL(18,2),
ADD COLUMN     "fxRate" DECIMAL(18,4);
