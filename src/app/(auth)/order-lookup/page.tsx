"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { lookupOrderAction } from "@/actions/order-lookup";
import { Package, Truck, CheckCircle2 } from "lucide-react";

export default function OrderLookupPage() {
  const [state, formAction, isPending] = useActionState(
    lookupOrderAction,
    null
  );

  const order = (state as any)?.success ? (state as any).order : null;

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-2xl font-black text-center mb-2">비회원 주문조회</h1>
      <p className="text-center text-xs text-gray-500 mb-8">
        주문번호와 주문 시 입력한 이메일로 조회할 수 있습니다
      </p>

      {!order && (
        <form action={formAction} className="space-y-4">
          <Input
            name="orderNumber"
            placeholder="주문번호 (예: NK202604210001)"
            className="h-12 bg-gray-50 border-gray-200 rounded-lg text-sm"
            required
          />
          <Input
            name="email"
            type="email"
            placeholder="주문 시 입력한 이메일"
            className="h-12 bg-gray-50 border-gray-200 rounded-lg text-sm"
            required
          />

          {state?.error && (
            <p className="text-sm text-[var(--sale)] text-center">
              {state.error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-12 bg-black hover:bg-gray-800 text-white font-bold text-sm rounded-lg"
          >
            {isPending ? "조회 중..." : "주문 조회"}
          </Button>
        </form>
      )}

      {order && (
        <div className="space-y-4">
          {/* 주문 헤더 */}
          <div className="bg-gray-50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">주문번호</span>
              <span className="text-xs font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">주문일</span>
              <span className="text-xs">{order.createdAt}</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-500">상태</span>
              <Badge variant="default">{order.statusLabel}</Badge>
            </div>
            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-xs text-gray-500">결제금액</span>
              <span className="text-lg font-bold">
                {order.finalAmount.toLocaleString()}원
              </span>
            </div>
          </div>

          {/* 배송 정보 */}
          {order.trackingNumber && (
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-900">
                  배송 추적
                </span>
              </div>
              <p className="text-sm font-semibold">
                {order.trackingCarrier ?? "택배사"} {order.trackingNumber}
              </p>
            </div>
          )}

          {/* 배송지 */}
          {order.address && (
            <div className="border rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2">배송지</p>
              <p className="text-sm font-semibold">
                {order.address.recipient}
              </p>
              <p className="text-xs text-gray-500">{order.address.phone}</p>
              <p className="text-xs text-gray-500 mt-1">
                [{order.address.zipCode}] {order.address.address1}{" "}
                {order.address.address2}
              </p>
            </div>
          )}

          {/* 주문 상품 */}
          <div className="border rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-3">
              주문 상품 ({order.items.length}개)
            </p>
            <div className="space-y-3">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden shrink-0">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-400">
                      {item.brandName}
                    </p>
                    <p className="text-sm truncate">{item.productName}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {item.size && `${item.size} · `}
                      {item.color && `${item.color} · `}
                      수량 {item.quantity}
                    </p>
                    <p className="text-sm font-bold mt-1">
                      {item.totalPrice.toLocaleString()}원
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/order-lookup"
            className="block text-center text-xs text-gray-500 hover:text-black underline"
          >
            다른 주문 조회하기
          </Link>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 mt-8 text-xs text-gray-400">
        <Link href="/login" className="hover:text-black">
          로그인
        </Link>
        <span>|</span>
        <Link href="/register" className="hover:text-black">
          회원가입
        </Link>
      </div>

      <p className="text-[11px] text-gray-400 text-center mt-6 leading-relaxed">
        주문번호를 모르시나요?
        <br />
        고객센터 1544-7199로 문의해주세요.
      </p>
    </div>
  );
}
