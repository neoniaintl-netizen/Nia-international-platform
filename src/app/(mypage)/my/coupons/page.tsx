import { auth } from "@/lib/auth";
import { getUserCoupons } from "@/lib/queries";
import { redirect } from "next/navigation";
import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function CouponsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/my/coupons");

  const userCoupons = await getUserCoupons(session.user.id);

  const now = new Date();
  const available = userCoupons.filter((uc) => !uc.usedAt && uc.coupon.expiresAt >= now);
  const used = userCoupons.filter((uc) => uc.usedAt);
  const expired = userCoupons.filter((uc) => !uc.usedAt && uc.coupon.expiresAt < now);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">쿠폰함</h1>
        <Badge variant="outline" className="text-sm">{available.length}장 사용 가능</Badge>
      </div>

      {userCoupons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">보유한 쿠폰이 없습니다</p>
            <p className="text-xs text-gray-400 mt-1">이벤트 참여로 쿠폰을 받아보세요!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Available coupons */}
          {available.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-gray-500 mb-3">사용 가능 ({available.length})</h2>
              <div className="space-y-3">
                {available.map((uc) => (
                  <CouponCard key={uc.id} coupon={uc.coupon} status="available" />
                ))}
              </div>
            </section>
          )}

          {/* Used coupons */}
          {used.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-gray-500 mb-3">사용 완료 ({used.length})</h2>
              <div className="space-y-3 opacity-50">
                {used.map((uc) => (
                  <CouponCard key={uc.id} coupon={uc.coupon} status="used" />
                ))}
              </div>
            </section>
          )}

          {/* Expired coupons */}
          {expired.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-gray-500 mb-3">기간 만료 ({expired.length})</h2>
              <div className="space-y-3 opacity-50">
                {expired.map((uc) => (
                  <CouponCard key={uc.id} coupon={uc.coupon} status="expired" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function CouponCard({
  coupon,
  status,
}: {
  coupon: {
    name: string;
    description: string | null;
    discountType: string;
    discountValue: number;
    minOrderAmount: number | null;
    maxDiscount: number | null;
    expiresAt: Date;
  };
  status: "available" | "used" | "expired";
}) {
  const discountText =
    coupon.discountType === "PERCENTAGE"
      ? `${coupon.discountValue}%`
      : `${coupon.discountValue.toLocaleString()}원`;

  return (
    <Card className={`overflow-hidden ${status === "available" ? "border-black" : ""}`}>
      <CardContent className="p-0">
        <div className="flex">
          {/* Left: discount */}
          <div className={`w-24 shrink-0 flex flex-col items-center justify-center py-4 ${
            status === "available" ? "bg-black text-white" : "bg-gray-100 text-gray-400"
          }`}>
            <span className="text-xl font-bold">{discountText}</span>
            <span className="text-[10px] mt-0.5">할인</span>
          </div>
          {/* Right: info */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm">{coupon.name}</p>
                {coupon.description && (
                  <p className="text-xs text-gray-400 mt-0.5">{coupon.description}</p>
                )}
              </div>
              {status === "used" && <Badge variant="outline" className="text-[10px]">사용완료</Badge>}
              {status === "expired" && <Badge variant="outline" className="text-[10px]">기간만료</Badge>}
            </div>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
              {coupon.minOrderAmount && (
                <span>{coupon.minOrderAmount.toLocaleString()}원 이상 주문 시</span>
              )}
              {coupon.maxDiscount && (
                <span>최대 {coupon.maxDiscount.toLocaleString()}원 할인</span>
              )}
              <span>~{coupon.expiresAt.toLocaleDateString("ko-KR")}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
