import { getAdminOrders } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusSelect } from "@/components/admin/order-status-select";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "결제대기", cls: "bg-gray-100 text-gray-600" },
  PAID: { label: "결제완료", cls: "bg-blue-100 text-blue-700" },
  PREPARING: { label: "배송준비", cls: "bg-yellow-100 text-yellow-700" },
  SHIPPED: { label: "배송중", cls: "bg-purple-100 text-purple-700" },
  DELIVERED: { label: "배송완료", cls: "bg-green-100 text-green-700" },
  CANCELLED: { label: "취소", cls: "bg-red-100 text-red-700" },
  RETURN_REQUESTED: { label: "반품요청", cls: "bg-orange-100 text-orange-700" },
  RETURNED: { label: "반품완료", cls: "bg-gray-100 text-gray-500" },
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const limit = 20;
  const { orders, total } = await getAdminOrders({
    status: params.status,
    search: params.search,
    limit,
    offset: (page - 1) * limit,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">주문 관리</h1>
        <Badge variant="outline">{total}건</Badge>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "", label: "전체" },
          { key: "PAID", label: "결제완료" },
          { key: "PREPARING", label: "배송준비" },
          { key: "SHIPPED", label: "배송중" },
          { key: "DELIVERED", label: "배송완료" },
          { key: "CANCELLED", label: "취소" },
        ].map((f) => (
          <a
            key={f.key}
            href={`/admin/orders${f.key ? `?status=${f.key}` : ""}`}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              (params.status ?? "") === f.key
                ? "bg-black text-white border-black"
                : "hover:bg-gray-50"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>주문번호</TableHead>
                <TableHead>주문자</TableHead>
                <TableHead>상품 수</TableHead>
                <TableHead className="text-right">결제금액</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>주문일</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const st = STATUS_MAP[order.status] ?? { label: order.status, cls: "" };
                return (
                  <TableRow key={order.id}>
                    <TableCell className="text-sm font-mono">{order.orderNumber}</TableCell>
                    <TableCell>
                      <p className="text-sm">{order.user.name || "-"}</p>
                      <p className="text-[10px] text-gray-400">{order.user.email}</p>
                    </TableCell>
                    <TableCell className="text-sm">{order.items.length}개</TableCell>
                    <TableCell className="text-sm text-right font-medium">
                      {order.finalAmount.toLocaleString()}원
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${st.cls}`}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {order.createdAt.toLocaleDateString("ko-KR")}
                    </TableCell>
                    <TableCell>
                      <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                    주문이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
