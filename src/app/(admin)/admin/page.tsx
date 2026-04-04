import { getAdminDashboardStats } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  ShoppingBag,
  Users,
  Tag,
  Image,
  Ticket,
  TrendingUp,
  Clock,
  FileCheck,
} from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>

      {/* Revenue highlight */}
      <Card className="bg-black text-white">
        <CardContent className="py-6">
          <p className="text-sm text-white/60">이번 달 매출</p>
          <p className="text-3xl font-bold mt-1">
            {stats.monthRevenue.toLocaleString()}원
          </p>
          <p className="text-xs text-white/40 mt-2">
            오늘 주문 {stats.todayOrders}건 · 전체 주문 {stats.totalOrders}건
          </p>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          label="전체 상품"
          value={stats.totalProducts}
          icon={Package}
          href="/admin/products"
        />
        <StatCard
          label="판매 중"
          value={stats.activeProducts}
          icon={FileCheck}
          color="green"
          href="/admin/products"
        />
        <StatCard
          label="검수 대기"
          value={stats.draftProducts}
          icon={Clock}
          color="yellow"
          href="/admin/products"
        />
        <StatCard
          label="전체 주문"
          value={stats.totalOrders}
          icon={ShoppingBag}
          href="/admin/orders"
        />
        <StatCard
          label="오늘 주문"
          value={stats.todayOrders}
          icon={TrendingUp}
          color="blue"
          href="/admin/orders"
        />
        <StatCard
          label="회원 수"
          value={stats.totalUsers}
          icon={Users}
          href="/admin/users"
        />
        <StatCard
          label="브랜드"
          value={stats.totalBrands}
          icon={Tag}
          href="/admin/brands"
        />
        <StatCard
          label="배너"
          value={stats.totalBanners}
          icon={Image}
          href="/admin/banners"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  href,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  href: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    red: "text-red-500 bg-red-50",
    yellow: "text-yellow-600 bg-yellow-50",
  };
  const cls = color ? colorMap[color] : "text-gray-600 bg-gray-50";

  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
            </div>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${cls}`}
            >
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
