import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyFgkey,
  FUNPAY_SUCCESS_CODE,
  FUNPAY_PROCESSING_CODE,
} from "@/lib/payment/funpay";
import { restoreOrderResources } from "@/lib/order-restore";

/**
 * POST /api/payment/funpay/notify  (statusurl)
 *
 * Funpay(ICB) 결제 최종 확정 노티 수신.
 * - 요청: FormData (Funpay → 가맹점, 비동기 서버 호출)
 * - 응답: 빈 화면에 평문 "SUCCESS" / "FAIL" (HTML/JSON 으로 감싸면 실패 처리됨)
 * - SUCCESS 가 확인 안 되면 Funpay 가 1·3·5·10·15·20·30·40·55분 간격 재시도
 *
 * 처리:
 *  1) fgkey 검증 (위·변조 차단)
 *  2) refno(=orderNumber) 로 주문 조회
 *  3) 멱등: 이미 PAID 면 SUCCESS 즉시 응답 (중복 노티)
 *  4) rescode 성공 → 주문 PAID + 결제 COMPLETED + 적립 + 장바구니 비움
 *     rescode 실패 → 주문 CANCELLED + 재고/쿠폰/포인트 복원
 *  5) 노티 수신·처리 성공이면 항상 "SUCCESS" (결제 실패 여부는 주문 상태로 표현)
 */

function plain(text: string) {
  return new Response(text, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

/** ICB 노티에서 원거래번호(transid) 추출 — 필드명이 다를 수 있어 후보를 대소문자 무시로 탐색 */
function extractTransId(params: Record<string, string>): string {
  const lower: Record<string, string> = {};
  for (const k of Object.keys(params)) lower[k.toLowerCase()] = params[k];
  const candidates = [
    "transid", "trans_id", "transactionid", "transaction_id",
    "tradeno", "trade_no", "tradenumber", "tradeid", "trade_id",
    "tid", "trxid", "trx_id", "tno", "trno",
    "apprno", "approvalno", "approval_no",
    "pgtid", "pg_tid", "orgtransid", "org_transid", "ictransid", "mtransid",
  ];
  for (const c of candidates) {
    if (lower[c]) return lower[c];
  }
  return "";
}

export async function POST(req: NextRequest) {
  let params: Record<string, string> = {};
  try {
    const form = await req.formData();
    for (const [k, v] of form.entries()) params[k] = String(v);
  } catch {
    return plain("FAIL");
  }

  // 노티 수신 payload (서명 fgkey 제외) — 로그 + DB 저장(pgRaw) 공용
  const rawPayload = (() => {
    const r = { ...params };
    delete r.fgkey;
    return JSON.stringify(r);
  })();
  console.log("[Funpay notify] 수신", rawPayload);

  // 1) fgkey 검증
  if (!verifyFgkey(params)) {
    console.error("[Funpay notify] fgkey 검증 실패", { refno: params.refno });
    return plain("FAIL");
  }

  const refno = params.refno;
  const rescode = params.rescode ?? params.resultcode ?? "";
  // 거래번호(transid): ICB 노티의 필드명이 환경마다 다를 수 있어 후보를 대소문자 무시 탐색.
  // (transid 가 비면 환불 시 주문번호가 대신 가서 환불이 안 되므로 폭넓게 잡는다.)
  const transid = extractTransId(params);
  if (!refno) return plain("FAIL");

  const order = await prisma.order.findUnique({
    where: { orderNumber: refno },
    include: { payment: true, items: true },
  });
  if (!order) {
    console.error("[Funpay notify] 주문 없음", { refno });
    return plain("FAIL");
  }

  // 3) 멱등 — 이미 확정된 주문
  if (order.status !== "PENDING") {
    return plain("SUCCESS");
  }

  // 8000 = 결제 진행 중 — 아직 확정 아님. 정상 수신했으므로 SUCCESS 응답 + PENDING 유지.
  if (rescode === FUNPAY_PROCESSING_CODE) {
    return plain("SUCCESS");
  }

  const isSuccess = rescode === FUNPAY_SUCCESS_CODE;

  // 금액 교차검증 (심층 방어) — 노티의 결제 금액·통화가 주문 생성 시 PG 에 보낸 값과 다르면 확정 거부.
  // fgkey 가 파라미터 전체를 서명하므로 위조는 이미 차단되지만, 요청/노티 불일치 이상 징후를 잡는다.
  if (isSuccess && order.payment?.pgAmount != null && params.reqamt) {
    const expected = Number(order.payment.pgAmount);
    const got = Number(params.reqamt);
    const currencyMismatch =
      Boolean(order.payment.pgCurrency && params.reqcur) &&
      order.payment.pgCurrency !== params.reqcur;
    if (
      currencyMismatch ||
      (Number.isFinite(expected) && Number.isFinite(got) && Math.abs(expected - got) > 0.005)
    ) {
      console.error("[Funpay notify] 금액/통화 불일치 — 확정 거부, 수동 확인 필요", {
        refno,
        expected: `${order.payment.pgAmount} ${order.payment.pgCurrency}`,
        got: `${params.reqamt} ${params.reqcur}`,
      });
      return plain("FAIL");
    }
  }

  try {
    if (isSuccess) {
      // ── 결제 성공 확정 ──
      const earnPoints = Math.floor(order.finalAmount * 0.01);
      let won = true;
      await prisma.$transaction(async (tx) => {
        // CAS: PENDING → PAID 전이를 이긴 쪽만 후속 처리 (취소와의 경합 방지)
        const res = await tx.order.updateMany({
          where: { id: order.id, status: "PENDING" },
          data: { status: "PAID", paidAt: new Date() },
        });
        if (res.count === 0) {
          won = false;
          return;
        }
        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: {
              status: "COMPLETED",
              transactionId: transid || order.payment.transactionId,
              pgRaw: rawPayload, // 노티 원본 저장 (디버그 + 실제 거래번호 필드 확인)
              paidAt: new Date(),
            },
          });
        }
        // 구매 적립 (1%)
        if (earnPoints > 0) {
          const bal =
            (
              await tx.pointHistory.aggregate({
                where: { userId: order.userId },
                _sum: { amount: true },
              })
            )._sum.amount ?? 0;
          await tx.pointHistory.create({
            data: {
              userId: order.userId,
              amount: earnPoints,
              balance: bal + earnPoints,
              type: "EARN_PURCHASE",
              description: `구매 적립 (${order.orderNumber})`,
            },
          });
        }
      });
      if (!won) {
        // 그 사이 주문이 취소됨(CANCELLED 등) — 그런데 결제 성공 노티가 왔다 = 돈은 받은 상태.
        // 자동으로 되살리지 않고 크게 로그를 남겨 수동 환불/확인 대상으로 표시. pgRaw 는 저장.
        console.error(
          "[Funpay notify] 결제 성공 노티 수신했으나 주문이 이미 다른 상태로 전이됨 — 수동 환불/확인 필요",
          { refno, transid, rescode }
        );
        if (order.payment) {
          await prisma.payment.update({
            where: { id: order.payment.id },
            data: { pgRaw: rawPayload, transactionId: transid || order.payment.transactionId },
          });
        }
        return plain("SUCCESS");
      }
      // 장바구니에서 주문된 항목만 제거 (선택 결제 지원 — 미선택 항목은 유지)
      for (const item of order.items) {
        await prisma.cartItem.deleteMany({
          where: {
            userId: order.userId,
            productId: item.productId,
            variantId: item.variantId ?? null,
          },
        });
      }
      console.log(
        "[Funpay notify] 결제 확정(승인)",
        JSON.stringify({
          refno,
          transid,
          rescode,
          reqcur: params.reqcur,
          reqamt: params.reqamt,
          paytype: params.paytype,
          resmsg: params.resmsg,
        })
      );
    } else {
      // ── 결제 실패 → 주문 취소 + 복원 ──
      await prisma.$transaction(async (tx) => {
        // CAS: PENDING → CANCELLED 전이를 이긴 쪽만 복원 실행 (이중 복원 방지)
        const res = await tx.order.updateMany({
          where: { id: order.id, status: "PENDING" },
          data: { status: "CANCELLED" },
        });
        if (res.count === 0) return; // 이미 취소/확정됨 — 멱등
        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: { status: "FAILED", pgRaw: rawPayload },
          });
        }
        // 재고(+품절 해제)·쿠폰·포인트 복원 — src/lib/order-restore.ts 공용 로직
        await restoreOrderResources(tx, order);
      });
      console.warn("[Funpay notify] 결제 실패 → 주문 취소", { refno, rescode, resmsg: params.resmsg });
    }
  } catch (e: any) {
    // 처리 중 오류 → SUCCESS 안 줌 → Funpay 재시도 유도
    console.error("[Funpay notify] 처리 오류", { refno, error: e?.message });
    return plain("FAIL");
  }

  return plain("SUCCESS");
}
