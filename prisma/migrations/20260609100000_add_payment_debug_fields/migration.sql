-- AlterTable: 결제 노티 원본 payload + 환불(refund.icb) 응답 원본 저장
-- (디버그 + ICB가 보내는 실제 거래번호 필드 확인 → 환불 transid 정확화)
ALTER TABLE "payments" ADD COLUMN     "pgRaw" TEXT,
ADD COLUMN     "refundRaw" TEXT;
