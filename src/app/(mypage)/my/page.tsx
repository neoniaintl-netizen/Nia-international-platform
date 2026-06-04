import { ChevronRight, Package, RotateCcw, Bell, Eye, Heart, Gift, Settings, Truck, CheckCircle, Wrench, Bookmark } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
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

  const userName = session.user.name ?? "회원";
  const userInitial = userName.charAt(0).toUpperCase();
  const totalOrders = orders.length;

  // 작성 가능한 후기: 배송완료 주문 수 (간이 계산)
  const writableReviewCount = statusCounts.delivered;

  // 회원 등급 (간이)
  const level = totalOrders >= 20 ? { name: "GOLD", num: 3, benefit: "최대 5% 적립" }
    : totalOrders >= 5 ? { name: "SILVER", num: 2, benefit: "최대 3% 적립" }
    : { name: "BRONZE", num: 1, benefit: "최대 1% 적립" };

  return (
    <div className="max-w-[640px] mx-auto">
      {/* ── 프로필 섹션 ── */}
      <div className="px-4 pt-2 pb-4">
        <div className="flex items-center gap-3">
          {/* 아바타 */}
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-500 shrink-0">
            {userInitial}
          </div>
          {/* 이름 + 프로필 편집 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-bold truncate">{userName}</span>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </div>
          </div>
          <Link
            href="/my/profile"
            className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shrink-0"
          >
            프로필 수정
          </Link>
        </div>
      </div>

      {/* ── 등급 배너 ── */}
      <Link href="/my/points" className="block mx-4 mb-4">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
          <span className="text-[13px] text-blue-600 font-medium">
            LV.{level.num} {level.name} · {level.benefit} · 무료배송
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </Link>

      {/* ── 적립금 / 쿠폰 / 좋아요 ── */}
      <div className="mx-4 mb-2 border border-gray-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-gray-200">
          <Link href="/my/points" className="py-4 text-center hover:bg-gray-50 transition-colors">
            <p className="text-[11px] text-gray-500 mb-1">적립금 &gt;</p>
            <p className="text-[15px] font-bold">{points.toLocaleString()}원</p>
          </Link>
          <Link href="/my/coupons" className="py-4 text-center hover:bg-gray-50 transition-colors">
            <p className="text-[11px] text-gray-500 mb-1">쿠폰 &gt;</p>
            <p className="text-[15px] font-bold">{couponCount}장</p>
          </Link>
          <Link href="/wishlist" className="py-4 text-center hover:bg-gray-50 transition-colors">
            <p className="text-[11px] text-gray-500 mb-1">좋아요 &gt;</p>
            <p className="text-[15px] font-bold">{wishlist.length}개</p>
          </Link>
        </div>
      </div>

      {/* ── 작성 가능한 후기 ── */}
      <Link href="/my/orders" className="block mx-4 mb-6">
        <div className="flex items-center justify-between py-3">
          <span className="text-[13px] font-medium">작성 가능한 후기 {writableReviewCount}개</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </Link>

      {/* ── 주문 현황 ── */}
      <div className="mx-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-bold">주문 현황</h3>
          <Link href="/my/orders" className="text-xs text-gray-400 flex items-center">
            전체보기 <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "결제완료", count: statusCounts.paid, icon: Package },
            { label: "배송중", count: statusCounts.shipped, icon: Truck },
            { label: "배송완료", count: statusCounts.delivered, icon: CheckCircle },
            { label: "취소/반품", count: statusCounts.cancelled, icon: RotateCcw },
          ].map(({ label, count, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center py-3 bg-gray-50 rounded-lg">
              <Icon className="w-5 h-5 text-gray-400 mb-1.5" strokeWidth={1.5} />
              <p className="text-lg font-bold">{count}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 프로모 배너 ── */}
      <div className="mx-4 mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl px-5 py-4 text-white">
          <p className="text-[13px] font-bold">신규 회원 혜택</p>
          <p className="text-[11px] text-white/70 mt-0.5">첫 구매 시 10% 추가 적립! 지금 바로 쇼핑하세요</p>
        </div>
      </div>

      {/* ── 메뉴 리스트 ── */}
      <div className="border-t border-gray-100">
        <MenuItem href="/my/orders" icon={Package} label="주문 내역" desc="온·오프라인 주문 내역 모아보기" />
        <MenuItem href="/my/orders" icon={RotateCcw} label="취소/반품/교환 내역" />
        <MenuItem href="/my/addresses" icon={Truck} label="배송지 관리" />
        <MenuItem href="/wishlist" icon={Heart} label="좋아요" />
        <MenuItem href="/my/brands" icon={Bookmark} label="팔로우 브랜드" />
        <MenuItem href="/my/repair" icon={Wrench} label="수선 진행조회" />
        <MenuItem href="/membership" icon={Gift} label="멤버십 혜택" badge="NEW" />
        <MenuItem href="/event/payment" icon={Gift} label="이벤트/회원혜택" />
        <MenuItem href="/my/profile" icon={Settings} label="설정" />
      </div>

      {/* ── 로그아웃 ── */}
      <div className="border-t border-gray-100 mt-2 mb-8">
        <LogoutButton variant="row" />
      </div>
    </div>
  );
}

function MenuItem({
  href,
  icon: Icon,
  label,
  desc,
  badge,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  desc?: string;
  badge?: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors">
      <Icon className="w-5 h-5 text-gray-400 shrink-0" strokeWidth={1.5} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium">{label}</span>
          {badge && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 rounded">
              {badge}
            </span>
          )}
        </div>
        {desc && <p className="text-[12px] text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
    </Link>
  );
}
