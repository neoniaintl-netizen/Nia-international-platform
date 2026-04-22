import Link from "next/link";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Package, User, MapPin, Tag, Coins, Heart, ChevronRight, Settings, Wrench, Bookmark } from "lucide-react";
import { auth } from "@/lib/auth";
import { getUserPoints, getUserCouponCount, getCartCount } from "@/lib/queries";

const SIDEBAR_ITEMS = [
  { label: "주문 내역", href: "/my/orders", icon: Package },
  { label: "프로필 수정", href: "/my/profile", icon: User },
  { label: "배송지 관리", href: "/my/addresses", icon: MapPin },
  { label: "쿠폰", href: "/my/coupons", icon: Tag },
  { label: "적립금", href: "/my/points", icon: Coins },
  { label: "좋아요", href: "/wishlist", icon: Heart },
  { label: "팔로우 브랜드", href: "/my/brands", icon: Bookmark },
  { label: "수선 진행조회", href: "/my/repair", icon: Wrench },
  { label: "설정", href: "/my/profile", icon: Settings },
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
      <div className="max-w-[1280px] mx-auto pb-20 lg:pb-6">
        {/* 모바일: 마이 타이틀 */}
        <div className="lg:hidden px-4 py-3">
          <h1 className="text-[18px] font-bold">마이</h1>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8 lg:px-6 lg:py-6">
          {/* 데스크톱 사이드바 */}
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <div className="p-5 bg-[var(--ink)] text-white rounded-none mb-4">
                <p className="eyebrow text-[var(--champagne)] mb-1">Member</p>
                <p className="font-medium text-[15px] tracking-tight">
                  {userName}
                </p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-white/60 mt-1">
                  Bronze · Lv.1
                </p>
                <div className="h-px bg-white/20 my-4" />
                <div className="flex items-center justify-between text-[11px]">
                  <span className="uppercase tracking-[0.1em] text-white/60">
                    Points
                  </span>
                  <span className="font-medium num">
                    {points.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[11px]">
                  <span className="uppercase tracking-[0.1em] text-white/60">
                    Coupons
                  </span>
                  <span className="font-medium num">{couponCount}</span>
                </div>
              </div>
              <nav className="space-y-0 border-t border-[var(--line)]">
                {SIDEBAR_ITEMS.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={href + label}
                    href={href}
                    className="flex items-center gap-3 px-3 py-3 text-[13px] border-b border-[var(--line)] hover:text-[var(--champagne)] transition-colors"
                  >
                    <Icon
                      className="w-4 h-4 text-[var(--ink-muted)]"
                      strokeWidth={1.5}
                    />
                    {label}
                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-[var(--ink-muted)]/50" />
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* 콘텐츠 */}
          <main className="lg:col-span-3">{children}</main>
        </div>
      </div>
      <MobileNav />
    </>
  );
}
