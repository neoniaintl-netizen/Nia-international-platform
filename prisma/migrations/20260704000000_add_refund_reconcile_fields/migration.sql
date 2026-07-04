-- AlterTable: 실제 환불 확정 시각 + 관리자 확인용 불일치 메모
-- refundedAt: refund.icb 성공이 확정된 시각. 상태만 REFUNDED/CANCELLED 인 것은
--             크래시로 인한 미확정일 수 있어, 이 값이 있어야만 "환불됨"으로 신뢰한다.
-- reconcileNote: 자동 정리(order-cleanup)가 감지한 결제/주문 불일치 사유(고객용 note 와 분리).
ALTER TABLE "payments" ADD COLUMN "refundedAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "reconcileNote" TEXT;
