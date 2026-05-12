import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  LayoutDashboard,
  Bug,
  Package,
  ShoppingBag,
  Users,
  Tag,
  Image,
  Ticket,
  FolderTree,
  Sparkles,
  Camera,
  Wrench,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/crawl", label: "크롤링 관리", icon: Bug },
  { href: "/admin/products", label: "상품 관리", icon: Package },
  { href: "/admin/orders", label: "주문 관리", icon: ShoppingBag },
  { href: "/admin/categories", label: "카테고리 관리", icon: FolderTree },
  { href: "/admin/brands", label: "브랜드 관리", icon: Tag },
  { href: "/admin/banners", label: "배너 관리", icon: Image },
  { href: "/admin/events", label: "기획전 관리", icon: Sparkles },
  { href: "/admin/lookbooks", label: "룩북 관리", icon: Camera },
  { href: "/admin/repairs", label: "수선 관리", icon: Wrench },
  { href: "/admin/coupons", label: "쿠폰 관리", icon: Ticket },
  { href: "/admin/users", label: "회원 관리", icon: Users },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, name: true, email: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r shrink-0 fixed h-screen overflow-y-auto">
        <div className="p-4 border-b">
          <Link href="/admin" className="text-lg font-black tracking-tight">
            NOVAREN <span className="text-xs font-normal text-gray-400">Admin</span>
          </Link>
        </div>
        <nav className="p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-black transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          <Link href="/" className="text-xs text-gray-400 hover:text-black mt-1 block">
            스토어로 돌아가기 &rarr;
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 p-6">
        {children}
      </main>
    </div>
  );
}
