"use client";

import Link from "next/link";
import { Search, Heart, ShoppingBag, User, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CategoryMenu } from "./category-menu";

export function Header({ cartCount = 0 }: { cartCount?: number }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMenuOpen(true)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="카테고리 메뉴"
              >
                <Menu className="w-6 h-6" />
              </button>
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

      {/* Category Menu Popup */}
      <CategoryMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
