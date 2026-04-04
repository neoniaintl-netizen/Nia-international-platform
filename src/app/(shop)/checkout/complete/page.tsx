import { CheckCircle, Package, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOrderById } from "@/lib/queries";
import { redirect } from "next/navigation";

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

  const orderDate = order.createdAt.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const orderTime = order.createdAt.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // 예상 배송일: 주문일 + 2일
  const deliveryDate = new Date(order.createdAt);
  deliveryDate.setDate(deliveryDate.getDate() + 2);
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const deliveryStr = `${deliveryDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })} (${dayNames[deliveryDate.getDay()]}) 도착 예정`;

  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">주문이 완료되었습니다!</h1>
      <p className="text-gray-500 text-sm">주문 내역은 마이페이지에서 확인할 수 있습니다.</p>

      <div className="mt-8 border rounded-xl p-6 text-left">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">주문번호</span>
            <span className="font-mono font-bold">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">주문일시</span>
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
            <span className="text-gray-500">상품 금액</span>
            <span>{order.totalAmount.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">배송비</span>
            <span>{order.shippingFee === 0 ? "무료" : `${order.shippingFee.toLocaleString()}원`}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-[var(--sale)]">
              <span>할인</span>
              <span>-{order.discountAmount.toLocaleString()}원</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between">
            <span className="font-bold">총 결제 금액</span>
            <span className="text-xl font-bold">{order.finalAmount.toLocaleString()}원</span>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-xl flex items-center gap-3 text-left">
        <Package className="w-5 h-5 text-gray-400 shrink-0" />
        <div>
          <p className="text-sm font-medium">예상 배송일</p>
          <p className="text-xs text-gray-400">{deliveryStr}</p>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Link href="/my/orders" className="flex-1">
          <Button variant="outline" className="w-full h-12">
            주문 내역 보기
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
        <Link href="/" className="flex-1">
          <Button className="w-full h-12 bg-black hover:bg-gray-800 text-white">
            쇼핑 계속하기
          </Button>
        </Link>
      </div>
    </div>
  );
}
