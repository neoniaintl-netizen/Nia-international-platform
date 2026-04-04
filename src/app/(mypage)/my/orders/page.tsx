import { auth } from "@/lib/auth";
import { getUserOrders } from "@/lib/queries";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/my/orders");

  const orders = await getUserOrders(session.user.id);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">주문 내역</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="w-16 h-16 text-gray-200 mb-4" />
          <p className="text-lg font-medium text-gray-500 mb-2">주문 내역이 없습니다</p>
          <p className="text-sm text-gray-400">첫 주문을 해보세요!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = STATUS_MAP[order.status] ?? { label: order.status, variant: "outline" as const };
            const firstItem = order.items[0];
            const remainCount = order.items.length - 1;
            const canCancel = ["PAID", "PENDING", "PREPARING"].includes(order.status);

            return (
              <Card key={order.id}>
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">
                        {order.createdAt.toLocaleDateString("ko-KR")}
                      </p>
                      <p className="text-xs font-mono">{order.orderNumber}</p>
                    </div>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </div>

                  {/* Items */}
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.productName}
                            width={64}
                            height={64}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400">{item.brandName}</p>
                        <p className="text-sm font-medium truncate">{item.productName}</p>
                        <p className="text-xs text-gray-400">
                          {[item.color, item.size].filter(Boolean).join(" · ")} · {item.quantity}개
                        </p>
                        <p className="text-sm font-bold mt-0.5">{item.totalPrice.toLocaleString()}원</p>
                      </div>
                    </div>
                  ))}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-sm font-bold">
                      총 {order.finalAmount.toLocaleString()}원
                    </p>
                    <div className="flex gap-2">
                      {canCancel && (
                        <OrderCancelButton orderId={order.id} />
                      )}
                      <Link href={`/my/orders/${order.id}`}>
                        <button className="text-xs text-gray-500 border rounded-lg px-3 py-1.5 hover:bg-gray-50">
                          상세보기
                        </button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
