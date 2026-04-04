import Link from "next/link";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Package, User, MapPin, Tag, Coins, Heart, ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { getUserPoints, getUserCouponCount, getCartCount } from "@/lib/queries";

const SIDEBAR_ITEMS = [
  { label: "주문 내역", href: "/my/orders", icon: Package },
  { label: "프로필", href: "/my/profile", icon: User },
  { label: "배송지 관리", href: "/my/addresses", icon: MapPin },
  { label: "쿠폰", href: "/my/coupons", icon: Tag },
  { label: "적립금", href: "/my/points", icon: Coins },
  { label: "좋아요", href: "/wishlist", icon: Heart },
];

export default async function MyPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  const [points, couponCount, cartCount] = userId
    ? await Promise.all([
        getUserPoints(userId),
        getUserCouponCount(userId),
        getCartCount(userId),
      ])
    : [0, 0, 0];

  const userName = session?.user?.name ?? "회원";

  return (
    <>
      <Header cartCount={cartCount} />
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6 pb-20 lg:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <div className="p-4 bg-black text-white rounded-xl mb-4">
                <p className="font-bold">{userName}님</p>
                <p className="text-xs text-white/60 mt-1">BRONZE 회원</p>
                <div className="flex items-center justify-between mt-3 text-xs">
                  <span className="text-white/60">적립금</span>
                  <span className="font-bold">{points.toLocaleString()}원</span>
                </div>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="text-white/60">쿠폰</span>
                  <span className="font-bold">{couponCount}장</span>
                </div>
              </div>
              <nav className="space-y-1">
                {SIDEBAR_ITEMS.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-gray-400" />
                    {label}
                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-gray-300" />
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="lg:col-span-3">{children}</main>
        </div>
      </div>
      <MobileNav />
    </>
  );
}
