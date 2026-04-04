"use client";

import Link from "next/link";
import { Search, Heart, ShoppingBag, User, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function Header({ cartCount = 0 }: { cartCount?: number }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-[1280px] mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between h-14 px-4 lg:px-6">
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger className="lg:hidden p-1">
                <Menu className="w-6 h-6" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0">
                <SheetTitle className="sr-only">메뉴</SheetTitle>
                <MobileMenu session={session} />
              </SheetContent>
            </Sheet>
            <Link href="/" className="flex items-center">
              <span className="text-xl font-black tracking-tight">NKBUS</span>
            </Link>
          </div>

          {/* Center: Search (desktop) */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <form action="/search" className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                name="q"
                placeholder="브랜드, 상품, 스타일 검색"
                className="pl-10 bg-gray-50 border-gray-200 rounded-lg h-10"
              />
            </form>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-1">
            <button
              className="lg:hidden p-2"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search className="w-5 h-5" />
            </button>
            <Link href="/wishlist" className="p-2 hidden sm:block">
              <Heart className="w-5 h-5" />
            </Link>
            <Link href="/cart" className="p-2 relative">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 text-[10px] bg-black text-white px-1 flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </Badge>
              )}
            </Link>
            {isLoggedIn ? (
              <div className="hidden sm:flex items-center gap-1">
                <Link href="/my" className="p-2" title={session?.user?.name ?? "마이페이지"}>
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
                    {(session?.user?.name ?? "U").charAt(0).toUpperCase()}
                  </div>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="p-2 text-gray-400 hover:text-black"
                  title="로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link href="/login" className="p-2 hidden sm:block">
                <User className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Mobile search bar */}
        {searchOpen && (
          <div className="lg:hidden px-4 pb-3">
            <form action="/search" className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                name="q"
                placeholder="브랜드, 상품, 스타일 검색"
                className="pl-10 bg-gray-50 border-gray-200 rounded-lg h-10"
                autoFocus
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setSearchOpen(false)}
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}

function MobileMenu({ session }: { session: any }) {
  const isLoggedIn = !!session?.user;
  const categories = [
    { label: "상의", slug: "tops" },
    { label: "아우터", slug: "outer" },
    { label: "바지", slug: "pants" },
    { label: "원피스/스커트", slug: "dresses" },
    { label: "가방", slug: "bags" },
    { label: "신발", slug: "shoes" },
    { label: "모자", slug: "hats" },
    { label: "양말/레그웨어", slug: "socks" },
    { label: "속옷", slug: "underwear" },
    { label: "선글라스/안경테", slug: "eyewear" },
    { label: "액세서리", slug: "accessories" },
    { label: "시계", slug: "watches" },
    { label: "주얼리", slug: "jewelry" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
              {(session.user.name ?? "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">{session.user.name}님</p>
              <Link href="/my" className="text-xs text-gray-400 hover:text-black">
                마이페이지 →
              </Link>
            </div>
          </div>
        ) : (
          <Link href="/login" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium">로그인 해주세요</p>
              <p className="text-xs text-gray-400">회원가입/로그인</p>
            </div>
          </Link>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <p className="text-xs font-medium text-gray-400 mb-3">카테고리</p>
          <div className="space-y-1">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="block py-2.5 text-sm hover:text-black"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      {isLoggedIn && (
        <div className="p-4 border-t">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-black"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
