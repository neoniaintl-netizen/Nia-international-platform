"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateShipping } from "@/lib/shipping";
import { restoreOrderResources } from "@/lib/order-restore";
import { sweepStalePendingOrders } from "@/lib/order-cleanup";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  buildPaymentParams,
  buildTradeInformation,
  funpayServiceType,
  funpayReqType,
  toFunpayCharge,
  formatFunpayAmount,
  funpayErrorMessage,
  cancelPayment,
  FUNPAY_ENDPOINTS,
  FUNPAY_SUCCESS_CODE,
  FUNPAY_WECHAT_ENABLED,
  FUNPAY_KRW_PER_CNY,
  isFunpayConfigured,
} from "@/lib/payment/funpay";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.");
  return session.user.id;
}

function generateOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORD-${date}-${rand}`;
}

export async function createOrder(_prevState: any, formData: FormData) {
  const userId = await getUserId();

  // 방치된 PENDING 주문 기회적 정리 (비동기, 체크아웃 지연 없음 — 인스턴스당 5분 스로틀)
  sweepStalePendingOrders();

  const recipient = formData.get("recipient") as string;
  const phone = formData.get("phone") as string;
  const zipCode = formData.get("zipCode") as string;
  const address1 = formData.get("address1") as string;
  const address2 = formData.get("address2") as string;
  const memo = formData.get("memo") as string;
  const paymentMethod = (formData.get("paymentMethod") as string) || "CARD";
  const couponCode = (formData.get("couponCode") as string)?.trim() || null;
  const usedPoints = parseInt(formData.get("usedPoints") as string) || 0;
  // 선택 결제: 결제할 장바구니 항목 id (없으면 전체 결제 — 하위호환)
  const selectedItemIds = ((formData.get("selectedItemIds") as string) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!recipient || !phone || !zipCode || !address1) {
    return { error: "배송 정보를 모두 입력해주세요." };
  }

  // 위챗페이는 운영 검증 전까지 차단 (테스트 환경 9401). UI 숨김 + 서버 방어.
  if (paymentMethod === "WECHAT_PAY" && !FUNPAY_WECHAT_ENABLED) {
    return { error: "위챗페이는 현재 준비 중입니다. 알리페이로 결제해주세요." };
  }

  // Cart items (선택 결제 시 선택 항목만 — id 가 사용자 장바구니에 속해야 통과)
  const cartItems = await prisma.cartItem.findMany({
    where: {
      userId,
      ...(selectedItemIds.length > 0 ? { id: { in: selectedItemIds } } : {}),
    },
    include: {
      product: {
        include: {
          brand: { select: { name: true } },
          images: { where: { isMain: true }, take: 1 },
        },
      },
      variant: true,
    },
  });

  if (cartItems.length === 0) {
    return { error: "장바구니가 비어있습니다." };
  }

  // Calculate subtotal
  const totalAmount = cartItems.reduce((sum, item) => {
    const price = item.product.salePrice ?? item.product.originalPrice;
    return sum + price * item.quantity;
  }, 0);
  const shippingFee = calculateShipping(totalAmount);

  // --- Coupon validation ---
  let couponDiscount = 0;
  let validCoupon: any = null;
  let validUserCoupon: any = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (!coupon) return { error: "유효하지 않은 쿠폰 코드입니다." };
    if (!coupon.isActive) return { error: "비활성화된 쿠폰입니다." };

    const now = new Date();
    if (now < coupon.startsAt || now > coupon.expiresAt) return { error: "쿠폰 사용 기간이 아닙니다." };
    if (coupon.totalQuantity && coupon.usedCount >= coupon.totalQuantity) return { error: "쿠폰이 모두 소진되었습니다." };
    if (coupon.minOrderAmount && totalAmount < coupon.minOrderAmount) {
      return { error: `최소 주문금액 ${coupon.minOrderAmount.toLocaleString()}원 이상이어야 합니다.` };
    }

    const userCoupon = await prisma.userCoupon.findFirst({
      where: { userId, couponId: coupon.id, usedAt: null },
    });
    if (!userCoupon) return { error: "보유하지 않은 쿠폰이거나 이미 사용된 쿠폰입니다." };

    if (coupon.discountType === "PERCENTAGE") {
      couponDiscount = Math.floor(totalAmount * (coupon.discountValue / 100));
      if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
        couponDiscount = coupon.maxDiscount;
      }
    } else {
      couponDiscount = coupon.discountValue;
    }

    validCoupon = coupon;
    validUserCoupon = userCoupon;
  }

  // --- Points validation ---
  let pointsDiscount = 0;
  if (usedPoints > 0) {
    const currentPoints = await prisma.pointHistory.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    const balance = currentPoints._sum.amount ?? 0;
    if (usedPoints > balance) return { error: "보유 적립금이 부족합니다." };
    const maxUsable = totalAmount - couponDiscount;
    if (usedPoints > maxUsable) return { error: "적립금은 상품 금액을 초과할 수 없습니다." };
    pointsDiscount = usedPoints;
  }

  const discountAmount = couponDiscount + pointsDiscount;
  const finalAmount = totalAmount - discountAmount + shippingFee;

  // --- Stock validation ---
  for (const item of cartItems) {
    if (item.variantId && item.variant) {
      if (item.variant.stock < item.quantity) {
        return { error: `"${item.product.name}" (${item.variant.size || ""} ${item.variant.color || ""}) 재고가 부족합니다. (남은 수량: ${item.variant.stock}개)` };
      }
    }
  }

  // --- 결제 사전 검증 (주문 생성 전에 차단 → orphan PENDING 주문 방지) ---
  if (!isFunpayConfigured()) {
    return {
      error: "결제 설정이 완료되지 않았습니다. 관리자에게 문의해주세요. (FUNPAY_MID/SECRET 미설정)",
    };
  }
  // 원화 → 계약 통화(CNY) 환산. 환율 미설정 등이면 throw → 여기서 차단(fail-closed).
  let charge: { reqcur: string; reqamt: string };
  try {
    charge = toFunpayCharge(finalAmount);
  } catch (e: any) {
    return { error: e?.message ?? "결제 금액 처리 중 오류가 발생했습니다." };
  }
  // 환불 시 재현용으로 Payment 에 저장할 환율 (KRW 결제면 환산 없으므로 null)
  const fxRate = charge.reqcur === "KRW" ? null : FUNPAY_KRW_PER_CNY;

  // --- Transaction: create order + stock decrement + coupon/points ---
  const address = await prisma.address.create({
    data: {
      userId,
      label: "주문 배송지",
      recipient,
      phone,
      zipCode,
      address1,
      address2: address2 || null,
      isDefault: false,
    },
  });

  const orderNumber = generateOrderNumber();

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
    // 1. Stock decrement — 조건부 차감(stock >= quantity 일 때만)으로 동시 주문 오버셀 방지.
    //    사전 검증(위)은 스냅샷이라 동시 주문 시 음수 재고가 가능했음.
    for (const item of cartItems) {
      if (item.variantId) {
        const dec = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (dec.count === 0) {
          throw new Error(`OUT_OF_STOCK:${item.product.name}`);
        }
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { stock: true },
        });
        // If stock is now 0, check if all variants are sold out
        if ((variant?.stock ?? 0) <= 0) {
          const activeVariants = await tx.productVariant.count({
            where: { productId: item.productId, stock: { gt: 0 } },
          });
          if (activeVariants === 0) {
            await tx.product.update({
              where: { id: item.productId },
              data: { status: "SOLDOUT" },
            });
          }
        }
      }
    }

    // 2. Create order
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId,
        addressId: address.id,
        couponId: validCoupon?.id || null,
        status: "PENDING", // 결제 완료(노티) 전까지 PENDING. Funpay statusurl 노티에서 PAID 확정.
        totalAmount,
        discountAmount,
        shippingFee,
        finalAmount,
        paymentMethod: paymentMethod as any,
        note: memo || null,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.product.name,
            brandName: item.product.brand.name,
            imageUrl: item.product.images[0]?.url ?? null,
            color: item.variant?.color ?? null,
            size: item.variant?.size ?? null,
            quantity: item.quantity,
            unitPrice: item.product.salePrice ?? item.product.originalPrice,
            totalPrice: (item.product.salePrice ?? item.product.originalPrice) * item.quantity,
          })),
        },
        payment: {
          create: {
            method: paymentMethod as any,
            status: "PENDING", // Funpay 노티 수신 시 COMPLETED 로 확정
            amount: finalAmount, // 원화 기준 (회계용)
            pgCurrency: charge.reqcur, // 실제 PG 결제 통화 (CNY)
            pgAmount: charge.reqamt, // 실제 PG 결제 금액 (환불 시 이 값 사용)
            fxRate, // 적용 환율
            transactionId: orderNumber, // 임시. 노티에서 Funpay transid 로 갱신
          },
        },
      },
    });

    // 3. Mark coupon as used
    if (validUserCoupon) {
      await tx.userCoupon.update({
        where: { id: validUserCoupon.id },
        data: { usedAt: new Date() },
      });
      await tx.coupon.update({
        where: { id: validCoupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    // 4. Deduct points
    if (pointsDiscount > 0) {
      const currentBalance = (await tx.pointHistory.aggregate({
        where: { userId },
        _sum: { amount: true },
      }))._sum.amount ?? 0;

      await tx.pointHistory.create({
        data: {
          userId,
          amount: -pointsDiscount,
          balance: currentBalance - pointsDiscount,
          type: "USE_ORDER",
          description: `주문 사용 (${orderNumber})`,
        },
      });
    }

    // 적립 포인트(earn)는 결제 확정(노티) 시점에 지급 → /api/payment/funpay/notify
    return newOrder;
    });
  } catch (e: any) {
    if (typeof e?.message === "string" && e.message.startsWith("OUT_OF_STOCK:")) {
      const name = e.message.slice("OUT_OF_STOCK:".length);
      return { error: `"${name}" 재고가 방금 소진되었습니다. 장바구니를 확인해주세요.` };
    }
    throw e;
  }

  // ── Funpay 결제 승인 파라미터 생성 (브라우저가 이 값으로 payment.icb 에 POST submit) ──
  // (isFunpayConfigured / 환산은 트랜잭션 전에 이미 검증 — charge 재사용)
  const buyer = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  const firstName = cartItems[0]?.product.name ?? "상품";
  const productName =
    cartItems.length > 1 ? `${firstName} 외 ${cartItems.length - 1}건` : firstName;
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  // 원천사별 추가정보(trade_information) — 알리: goods_info, 위챗: goods_detail
  const tradeInfo = buildTradeInformation(
    paymentMethod,
    cartItems.map((it) => ({ name: it.product.name, quantity: it.quantity })),
  );

  const funpayParams = buildPaymentParams({
    refno: orderNumber,
    reqamt: charge.reqamt,
    reqcur: charge.reqcur,
    servicetype: funpayServiceType(paymentMethod),
    reqtype: funpayReqType(paymentMethod),
    restype: "PAGE",
    product: productName,
    buyername: recipient,
    trade_information: tradeInfo,
    refer_url: `${base}/checkout`,
    returnurl: `${base}/checkout/complete?orderId=${order.id}`,
    statusurl: `${base}/api/payment/funpay/notify`,
    tel: phone,
    email: buyer?.email ?? "",
  });

  revalidatePath("/cart");

  // checkout-form 이 이 값으로 hidden form 만들어 Funpay 결제창으로 POST 이동
  return {
    success: true as const,
    orderId: order.id,
    funpay: { action: FUNPAY_ENDPOINTS.payment, params: funpayParams },
  };
}

// --- Cancel order (with stock restoration) ---
export async function cancelOrder(orderId: string) {
  const userId = await getUserId();

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true, payment: true },
  });

  if (!order) return { error: "주문을 찾을 수 없습니다." };
  if (!["PAID", "PENDING", "PREPARING"].includes(order.status)) {
    return { error: "취소할 수 없는 주문 상태입니다." };
  }

  // 결제 완료된 주문이면 Funpay 실제 환불 먼저 호출 (성공해야 DB 취소)
  if (order.payment?.status === "COMPLETED" && order.payment.transactionId) {
    if (!isFunpayConfigured()) {
      return { error: "환불 설정이 완료되지 않았습니다. 관리자에게 문의해주세요." };
    }
    try {
      // 환불 금액은 결제 시 저장한 pgAmount/pgCurrency 사용 (재계산 아님 → 환율 변동 무관).
      // 옛 주문(저장값 없음)만 동일 환율로 fallback 재계산.
      let refundCur: string;
      let refundAmt: string;
      if (order.payment.pgCurrency && order.payment.pgAmount != null) {
        refundCur = order.payment.pgCurrency;
        refundAmt = formatFunpayAmount(Number(order.payment.pgAmount), refundCur);
      } else {
        const charge = toFunpayCharge(order.finalAmount);
        refundCur = charge.reqcur;
        refundAmt = charge.reqamt;
      }
      const refundRes = await cancelPayment({
        refundRefno: generateOrderNumber(), // 취소는 매번 새 유니크 refno (명세)
        transid: order.payment.transactionId,
        servicetype: funpayServiceType(order.paymentMethod ?? "ALIPAY"),
        reqcur: refundCur,
        reqamt: refundAmt,
        voidamt: refundAmt, // 전체 취소
        reasoncode: "R000", // 단순변심
      });
      // 환불 응답 + "보낸 transid" 를 저장·로깅 (성공/실패 무관하게 — 원인 진단용).
      // sentTransid 가 주문번호(ORD-…)면 = 노티에서 실거래번호를 못 받아 환불이 안 되는 것.
      const refundRaw = JSON.stringify({
        sentTransid: order.payment.transactionId,
        sentCur: refundCur,
        sentAmt: refundAmt,
        response: refundRes ?? null,
      });
      console.log("[cancelOrder] refund.icb", refundRaw);
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: { refundRaw },
      });
      const code = String(refundRes?.rescode ?? refundRes?.resultcode ?? "");
      if (code !== FUNPAY_SUCCESS_CODE) {
        return {
          error: `결제 취소(환불)에 실패했습니다. ${funpayErrorMessage(code)}`,
        };
      }
    } catch (e: any) {
      return { error: `환불 요청 중 오류가 발생했습니다. (${e?.message ?? "unknown"})` };
    }
  }

  let won = false;
  await prisma.$transaction(async (tx) => {
    // CAS: 취소 가능 상태에서 CANCELLED 로의 전이를 이긴 쪽만 복원 실행.
    // (노티 실패 처리·자동 정리와 동시에 와도 복원은 정확히 한 번)
    const res = await tx.order.updateMany({
      where: { id: orderId, status: { in: ["PAID", "PENDING", "PREPARING"] } },
      data: { status: "CANCELLED" },
    });
    if (res.count === 0) return;
    won = true;

    await tx.payment.updateMany({
      where: { orderId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    // 재고(+품절 해제)·쿠폰·포인트 복원 — src/lib/order-restore.ts 공용 로직
    await restoreOrderResources(tx, order);
  });

  if (!won) {
    return { error: "이미 취소되었거나 처리 중인 주문입니다. 주문 내역을 새로고침해주세요." };
  }

  revalidatePath("/my/orders");
  revalidatePath("/my");
  return { success: true };
}
