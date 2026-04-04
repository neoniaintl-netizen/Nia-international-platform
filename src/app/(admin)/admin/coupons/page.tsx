import { getAdminCoupons } from "@/lib/queries";
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
import { CouponForm } from "@/components/admin/coupon-form";
import { CouponActions } from "@/components/admin/coupon-actions";

export default async function AdminCouponsPage() {
  const coupons = await getAdminCoupons();
  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">쿠폰 관리</h1>
        <Badge variant="outline">{coupons.length}개 쿠폰</Badge>
      </div>

      <CouponForm />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>쿠폰명</TableHead>
                <TableHead>코드</TableHead>
                <TableHead>할인</TableHead>
                <TableHead>조건</TableHead>
                <TableHead className="text-right">발급/사용</TableHead>
                <TableHead>기간</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => {
                const isExpired = coupon.expiresAt < now;
                const discountText =
                  coupon.discountType === "PERCENTAGE"
                    ? `${coupon.discountValue}%`
                    : `${coupon.discountValue.toLocaleString()}원`;
                return (
                  <TableRow key={coupon.id} className={isExpired ? "opacity-50" : ""}>
                    <TableCell>
                      <p className="text-sm font-medium">{coupon.name}</p>
                      {coupon.description && (
                        <p className="text-[10px] text-gray-400">{coupon.description}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono">{coupon.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {discountText}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {coupon.minOrderAmount
                        ? `${coupon.minOrderAmount.toLocaleString()}원 이상`
                        : "없음"}
                      {coupon.maxDiscount &&
                        ` (최대 ${coupon.maxDiscount.toLocaleString()}원)`}
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      {coupon._count.userCoupons} / {coupon.usedCount}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {coupon.startsAt.toLocaleDateString("ko-KR")} ~{" "}
                      {coupon.expiresAt.toLocaleDateString("ko-KR")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-[10px] ${
                          isExpired
                            ? "bg-gray-100 text-gray-500"
                            : coupon.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {isExpired ? "만료" : coupon.isActive ? "활성" : "비활성"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <CouponActions couponId={coupon.id} isActive={coupon.isActive} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {coupons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                    쿠폰이 없습니다.
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
