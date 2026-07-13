import { CheckCircle, Package, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOrderById } from "@/lib/queries";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { PaymentPending } from "@/components/checkout/payment-pending";

export default async function CheckoutCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  const session = await auth();

  if (!session?.user?.id || !orderId) redirect("/");

  const order = await getOrderById(orderId, session.user.id);
  if (!order) redirect("/");

  const [t, locale] = await Promise.all([getTranslations("Checkout"), getLocale()]);
  const dtLocale = locale === "zh" ? "zh-CN" : locale === "en" ? "en-US" : "ko-KR";

  // Funpay 노티(statusurl)로 PAID 확정 전이면 PENDING — 결제 확인 대기 화면 (polling)
  if (order.status === "PENDING") {
    return <PaymentPending />;
  }

  // 결제 실패로 취소된 주문
  if (order.status === "CANCELLED") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold mb-2">{t("failTitle")}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {t("failDesc")}
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/cart">
            <Button variant="outline" className="h-11">{t("toCart")}</Button>
          </Link>
          <Link href="/">
            <Button className="h-11 bg-black text-white">{t("toHome")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const orderDate = order.createdAt.toLocaleDateString(dtLocale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const orderTime = order.createdAt.toLocaleTimeString(dtLocale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  // 예상 배송일: 주문일 + 2일
  const deliveryDate = new Date(order.createdAt);
  deliveryDate.setDate(deliveryDate.getDate() + 2);
  const deliveryStr = t("arrival", {
    date: deliveryDate.toLocaleDateString(dtLocale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    }),
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">{t("doneTitle")}</h1>
      <p className="text-gray-500 text-sm">{t("doneDesc")}</p>

      <div className="mt-8 border rounded-xl p-6 text-left">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t("orderNumber")}</span>
            <span className="font-mono font-bold">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t("orderDate")}</span>
            <span>{orderDate} {orderTime}</span>
          </div>
          <Separator />

          {/* 주문 상품 목록 */}
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600 truncate max-w-[200px]">
                  {item.productName} {item.quantity > 1 ? `×${item.quantity}` : ""}
                </span>
                <span>{item.totalPrice.toLocaleString()}원</span>
              </div>
            ))}
          </div>

          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t("itemsTotal")}</span>
            <span>{order.totalAmount.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t("shippingFee")}</span>
            <span>{order.shippingFee === 0 ? t("free") : `${order.shippingFee.toLocaleString()}원`}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-[var(--sale)]">
              <span>{t("discount")}</span>
              <span>-{order.discountAmount.toLocaleString()}원</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between">
            <span className="font-bold">{t("totalPayment")}</span>
            <span className="text-xl font-bold">{order.finalAmount.toLocaleString()}원</span>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-xl flex items-center gap-3 text-left">
        <Package className="w-5 h-5 text-gray-400 shrink-0" />
        <div>
          <p className="text-sm font-medium">{t("expectedDelivery")}</p>
          <p className="text-xs text-gray-400">{deliveryStr}</p>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Link href="/my/orders" className="flex-1">
          <Button variant="outline" className="w-full h-12">
            {t("viewOrders")}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
        <Link href="/" className="flex-1">
          <Button className="w-full h-12 bg-black hover:bg-gray-800 text-white">
            {t("continueShopping")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
