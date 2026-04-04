import { auth } from "@/lib/auth";
import { getOrderById } from "@/lib/queries";
import { redirect, notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck, CreditCard, ChevronLeft } from "lucide-react";
import { OrderCancelButton } from "@/components/order/order-cancel-button";
import Image from "next/image";
import Link from "next/link";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" }> = {
  PENDING: { label: "주문접수", variant: "outline" },
  PAID: { label: "결제완료", variant: "default" },
  PREPARING: { label: "상품준비중", variant: "secondary" },
  SHIPPED: { label: "배송중", variant: "secondary" },
  DELIVERED: { label: "배송완료", variant: "default" },
  CANCELLED: { label: "취소됨", variant: "destructive" },
  RETURN_REQUESTED: { label: "반품요청", variant: "destructive" },
  RETURNED: { label: "반품완료", variant: "outline" },
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  CARD: "신용카드",
  BANK_TRANSFER: "무통장입금",
  KAKAO_PAY: "카카오페이",
  NAVER_PAY: "네이버페이",
  TOSS_PAY: "토스페이",
  VIRTUAL_ACCOUNT: "가상계좌",
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const order = await getOrderById(id, session.user.id);
  if (!order) notFound();

  const statusInfo = STATUS_MAP[order.status] ?? { label: order.status, variant: "outline" as const };
  const canCancel = ["PAID", "PENDING", "PREPARING"].includes(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/my/orders" className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">주문 상세</h1>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{order.orderNumber}</p>
        </div>
        <Badge variant={statusInfo.variant} className="text-sm px-3 py-1">
          {statusInfo.label}
        </Badge>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4" /> 주문 상품
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="w-20 h-20 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Package className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-500">{item.brandName}</p>
                <p className="text-sm font-medium">{item.productName}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {[item.color, item.size].filter(Boolean).join(" / ")} · {item.quantity}개
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold">{item.totalPrice.toLocaleString()}원</span>
                  {item.quantity > 1 && (
                    <span className="text-xs text-gray-400">({item.unitPrice.toLocaleString()}원 × {item.quantity})</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Delivery Info */}
      {order.address && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="w-4 h-4" /> 배송 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">수령인</span>
              <span>{order.address.recipient}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">연락처</span>
              <span>{order.address.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">배송지</span>
              <span className="text-right max-w-[200px]">
                ({order.address.zipCode}) {order.address.address1} {order.address.address2}
              </span>
            </div>
            {order.note && (
              <div className="flex justify-between">
                <span className="text-gray-500">배송메모</span>
                <span>{order.note}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> 결제 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">결제수단</span>
            <span>{PAYMENT_METHOD_MAP[order.paymentMethod ?? ""] ?? order.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">상품 금액</span>
            <span>{order.totalAmount.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">배송비</span>
            <span>{order.shippingFee === 0 ? "무료" : `${order.shippingFee.toLocaleString()}원`}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-[var(--sale)]">
              <span>할인</span>
              <span>-{order.discountAmount.toLocaleString()}원</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold text-base">
            <span>총 결제 금액</span>
            <span>{order.finalAmount.toLocaleString()}원</span>
          </div>
          {order.paidAt && (
            <div className="flex justify-between text-xs text-gray-400">
              <span>결제일시</span>
              <span>
                {order.paidAt.toLocaleDateString("ko-KR")} {order.paidAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {canCancel && (
        <div className="flex justify-end">
          <OrderCancelButton orderId={order.id} />
        </div>
      )}
    </div>
  );
}
