import { auth } from "@/lib/auth";
import { getOrderById } from "@/lib/queries";
import { redirect, notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck, CreditCard, ChevronLeft, MapPin } from "lucide-react";
import { OrderCancelButton } from "@/components/order/order-cancel-button";
import { ReturnRequestForm } from "@/components/order/return-request-form";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

const STATUS_MAP: Record<string, { key: string; variant: "default" | "outline" | "secondary" | "destructive" }> = {
  PENDING: { key: "statusPending", variant: "outline" },
  PAID: { key: "statusPaid", variant: "default" },
  PREPARING: { key: "statusPreparing", variant: "secondary" },
  SHIPPED: { key: "statusShipped", variant: "secondary" },
  DELIVERED: { key: "statusDelivered", variant: "default" },
  CANCELLED: { key: "statusCancelled", variant: "destructive" },
  RETURN_REQUESTED: { key: "statusReturnReq", variant: "destructive" },
  RETURNED: { key: "statusReturned", variant: "outline" },
};

const PAYMENT_METHOD_KEY: Record<string, string> = {
  CARD: "pmCard",
  BANK_TRANSFER: "pmBank",
  KAKAO_PAY: "pmKakao",
  NAVER_PAY: "pmNaver",
  TOSS_PAY: "pmToss",
  VIRTUAL_ACCOUNT: "pmVirtual",
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const order = await getOrderById(id, session.user.id);
  if (!order) notFound();
  const t = await getTranslations("Mypage");

  const statusInfo = STATUS_MAP[order.status] ?? { key: "", variant: "outline" as const };
  const canCancel = ["PAID", "PENDING", "PREPARING"].includes(order.status);
  const canReturn = ["SHIPPED", "DELIVERED"].includes(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/my/orders" className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{t("orderDetailTitle")}</h1>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{order.orderNumber}</p>
        </div>
        <Badge variant={statusInfo.variant} className="text-sm px-3 py-1">
          {statusInfo.key ? t(statusInfo.key) : order.status}
        </Badge>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4" /> {t("orderItems")}
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
                  {[item.color, item.size].filter(Boolean).join(" / ")} · {item.quantity}
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
              <Truck className="w-4 h-4" /> {t("deliveryInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t("recipient")}</span>
              <span>{order.address.recipient}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("phone")}</span>
              <span>{order.address.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("shipTo")}</span>
              <span className="text-right max-w-[200px]">
                ({order.address.zipCode}) {order.address.address1} {order.address.address2}
              </span>
            </div>
            {order.note && (
              <div className="flex justify-between">
                <span className="text-gray-500">{t("deliveryMemo")}</span>
                <span>{order.note}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tracking Info */}
      {order.trackingNumber && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {t("shipTracking")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t("carrier")}</span>
              <span>{order.trackingCarrier ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("trackingNo")}</span>
              <span className="font-mono">{order.trackingNumber}</span>
            </div>
            {order.shippedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">{t("shippedDate")}</span>
                <span>{order.shippedAt.toLocaleDateString("ko-KR")}</span>
              </div>
            )}
            {order.deliveredAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">{t("deliveredDate")}</span>
                <span>{order.deliveredAt.toLocaleDateString("ko-KR")}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> {t("paymentInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">{t("paymentMethod")}</span>
            <span>{PAYMENT_METHOD_KEY[order.paymentMethod ?? ""] ? t(PAYMENT_METHOD_KEY[order.paymentMethod ?? ""]) : order.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t("itemsTotal")}</span>
            <span>{order.totalAmount.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t("shippingFee")}</span>
            <span>{order.shippingFee === 0 ? t("free") : `${order.shippingFee.toLocaleString()}원`}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-[var(--sale)]">
              <span>{t("discount")}</span>
              <span>-{order.discountAmount.toLocaleString()}원</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold text-base">
            <span>{t("totalPayment")}</span>
            <span>{order.finalAmount.toLocaleString()}원</span>
          </div>
          {order.paidAt && (
            <div className="flex justify-between text-xs text-gray-400">
              <span>{t("paidAt")}</span>
              <span>
                {order.paidAt.toLocaleDateString("ko-KR")} {order.paidAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {(canCancel || canReturn) && (
        <div className="flex justify-end gap-2">
          {canCancel && <OrderCancelButton orderId={order.id} />}
          {canReturn && <ReturnRequestForm orderId={order.id} />}
        </div>
      )}
    </div>
  );
}
