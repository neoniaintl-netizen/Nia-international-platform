import { Package, Tag, Coins, Heart, ChevronRight, Truck, CheckCircle, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { getUserOrders, getOrderStatusCounts, getUserPoints, getUserCouponCount, getUserWishlist } from "@/lib/queries";
import { redirect } from "next/navigation";

export default async function MyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/my");

  const [orders, statusCounts, points, couponCount, wishlist] = await Promise.all([
    getUserOrders(session.user.id),
    getOrderStatusCounts(session.user.id),
    getUserPoints(session.user.id),
    getUserCouponCount(session.user.id),
    getUserWishlist(session.user.id),
  ]);

  const recentOrders = orders.slice(0, 3);
  const userName = session.user.name ?? "회원";

  return (
    <div className="space-y-8">
      {/* Mobile: User info */}
      <div className="lg:hidden p-4 bg-black text-white rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-lg">{userName}님</p>
            <Badge className="bg-white/20 text-white text-[10px] mt-1">BRONZE</Badge>
          </div>
          <Link href="/my/profile" className="text-xs text-white/60 flex items-center">
            프로필 <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-3 mt-4 text-center">
          <div>
            <p className="text-xs text-white/60">적립금</p>
            <p className="font-bold mt-0.5">{points.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-white/60">쿠폰</p>
            <p className="font-bold mt-0.5">{couponCount}</p>
          </div>
          <div>
            <p className="text-xs text-white/60">좋아요</p>
            <p className="font-bold mt-0.5">{wishlist.length}</p>
          </div>
        </div>
      </div>

      {/* Order status */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">주문 현황</h2>
          <Link href="/my/orders" className="text-xs text-gray-400 flex items-center">
            전체보기 <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "결제완료", count: statusCounts.paid, icon: Package },
            { label: "배송중", count: statusCounts.shipped, icon: Truck },
            { label: "배송완료", count: statusCounts.delivered, icon: CheckCircle },
            { label: "취소/반품", count: statusCounts.cancelled, icon: RotateCcw },
          ].map(({ label, count, icon: Icon }) => (
            <Card key={label} className="text-center py-4">
              <CardContent className="p-0">
                <Icon className="w-5 h-5 mx-auto text-gray-400 mb-2" />
                <p className="text-xl font-bold">{count}</p>
                <p className="text-[10px] text-gray-400 mt-1">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick links for mobile */}
      <section className="lg:hidden">
        <h2 className="font-bold mb-4">바로가기</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "주문 내역", href: "/my/orders", icon: Package },
            { label: "쿠폰함", href: "/my/coupons", icon: Tag },
            { label: "적립금", href: "/my/points", icon: Coins },
            { label: "좋아요", href: "/wishlist", icon: Heart },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href}>
              <Card className="hover:bg-gray-50 transition-colors">
                <CardContent className="flex items-center gap-3 p-4">
                  <Icon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium">{label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent orders */}
      <section>
        <h2 className="font-bold mb-4">최근 주문</h2>
        {recentOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-400 text-sm">
              아직 주문 내역이 없습니다
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const firstItem = order.items[0];
              const remainCount = order.items.length - 1;

              return (
                <Link key={order.id} href={`/my/orders/${order.id}`}>
                  <Card className="hover:bg-gray-50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs text-gray-400">
                            {order.createdAt.toLocaleDateString("ko-KR")}
                          </p>
                          <p className="text-xs font-mono">{order.orderNumber}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {order.status === "PAID" ? "결제완료" : order.status === "DELIVERED" ? "배송완료" : order.status === "CANCELLED" ? "취소됨" : order.status}
                        </Badge>
                      </div>
                      {firstItem && (
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                            {firstItem.imageUrl ? (
                              <Image
                                src={firstItem.imageUrl}
                                alt={firstItem.productName}
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
                          <div>
                            <p className="text-sm font-medium">
                              {firstItem.productName}
                              {remainCount > 0 && ` 외 ${remainCount}건`}
                            </p>
                            <p className="text-xs text-gray-400">
                              {firstItem.brandName} · {[firstItem.color, firstItem.size].filter(Boolean).join(" · ")}
                            </p>
                            <p className="text-sm font-bold mt-1">{order.finalAmount.toLocaleString()}원</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
