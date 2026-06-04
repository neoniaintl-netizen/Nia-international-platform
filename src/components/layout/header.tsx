"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Heart, ShoppingBag, User, Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/logout-button";
import { CategoryMenu } from "./category-menu";
import { CHANNELS } from "@/lib/constants";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { MenuBrand, MenuCategory } from "@/lib/queries";

export function Header({
  cartCount = 0,
  menuBrands = [],
  menuCategories = [],
}: {
  cartCount?: number;
  menuBrands?: MenuBrand[];
  menuCategories?: MenuCategory[];
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white">
        {/* ━━ 1단: 글로벌 네비게이션 (64px) ━━ */}
        <div className="border-b border-gray-200/80">
          <div className="max-w-[1360px] mx-auto px-4 lg:px-8">
            <div className="flex items-center h-16">
              {/* 모바일 햄버거 */}
              <button
                onClick={() => setMenuOpen(true)}
                className="lg:hidden p-2 -ml-2 mr-1 hover:bg-gray-50 rounded-lg transition-colors"
                aria-label="카테고리 메뉴"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* 로고 */}
              <Link href="/" className="flex items-center shrink-0" aria-label="NOVAREN 홈">
                <Image
                  src="/novaren-logo2.png"
                  alt="NOVAREN"
                  width={210}
                  height={28}
                  priority
                  unoptimized
                  className="h-6 w-auto object-contain"
                />
              </Link>

              {/* 데스크톱: 글로벌 카테고리 메뉴 */}
              <nav
                className="hidden lg:flex items-center ml-10 gap-1"
                aria-label="카테고리"
              >
                {CHANNELS.map((channel) => {
                  const isActive = pathname.includes(`/category/${channel.slug}`);
                  return (
                    <Link
                      key={channel.slug}
                      href={`/category/${channel.slug}`}
                      className={cn(
                        "relative px-3 py-2 text-[13px] font-medium tracking-[0.1em] whitespace-nowrap transition-colors",
                        isActive
                          ? "text-[var(--ink)]"
                          : "text-[var(--ink-muted)]/70 hover:text-[var(--ink)]"
                      )}
                    >
                      {channel.displayName}
                      {isActive && (
                        <span className="absolute bottom-0 left-3 right-3 h-[1px] bg-[var(--ink)]" />
                      )}
                    </Link>
                  );
                })}
                <button
                  onClick={() => setMenuOpen(true)}
                  className="ml-1 px-2 py-2 text-gray-300 hover:text-black transition-colors"
                  aria-label="전체 카테고리"
                >
                  <Menu className="w-4 h-4" />
                </button>
              </nav>

              {/* 데스크톱: 검색 + 유틸리티 */}
              <div className="hidden lg:flex items-center ml-auto gap-1">
                <form
                  action="/search"
                  className={cn(
                    "relative transition-all duration-200",
                    searchFocused ? "w-[380px]" : "w-[280px]"
                  )}
                >
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
                  <input
                    ref={searchRef}
                    name="q"
                    placeholder="Search"
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className="w-full h-10 pl-10 pr-4 bg-[var(--paper)] border border-[var(--line)] rounded-none text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)]/60 placeholder:uppercase placeholder:tracking-[0.1em] placeholder:text-[11px] focus:outline-none focus:border-[var(--ink)] focus:bg-white transition-all"
                  />
                </form>

                <div className="flex items-center ml-2">
                  <Link
                    href="/wishlist"
                    className="p-2.5 text-gray-500 hover:text-black transition-colors"
                    aria-label="위시리스트"
                  >
                    <Heart className="w-[19px] h-[19px]" strokeWidth={1.6} />
                  </Link>
                  <Link
                    href="/cart"
                    className="p-2.5 relative text-gray-500 hover:text-black transition-colors"
                    aria-label="장바구니"
                  >
                    <ShoppingBag className="w-[19px] h-[19px]" strokeWidth={1.6} />
                    {cartCount > 0 && (
                      <Badge className="absolute top-1 right-0.5 h-[16px] min-w-[16px] text-[9px] bg-black text-white px-1 flex items-center justify-center rounded-full border-2 border-white">
                        {cartCount > 99 ? "99+" : cartCount}
                      </Badge>
                    )}
                  </Link>
                  {isLoggedIn ? (
                    <>
                      <Link
                        href="/my"
                        className="p-2.5 text-gray-500 hover:text-black transition-colors"
                        aria-label="마이페이지"
                      >
                        <div className="w-[22px] h-[22px] rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
                          {(session?.user?.name ?? "U").charAt(0).toUpperCase()}
                        </div>
                      </Link>
                      <LogoutButton variant="icon" className="p-2.5" />
                    </>
                  ) : (
                    <Link
                      href="/login"
                      className="p-2.5 text-gray-500 hover:text-black transition-colors"
                      aria-label="로그인 / 회원가입"
                    >
                      <User className="w-[19px] h-[19px]" strokeWidth={1.6} />
                    </Link>
                  )}
                </div>
              </div>

              {/* 모바일: 검색 + 장바구니 + 마이 */}
              <div className="flex items-center ml-auto lg:hidden gap-0.5">
                <button
                  className="p-2 text-gray-600"
                  onClick={() => setSearchOpen(!searchOpen)}
                  aria-label="검색"
                >
                  <Search className="w-[20px] h-[20px]" strokeWidth={1.8} />
                </button>
                <Link
                  href="/cart"
                  className="p-2 relative text-gray-600"
                  aria-label="장바구니"
                >
                  <ShoppingBag className="w-[20px] h-[20px]" strokeWidth={1.8} />
                  {cartCount > 0 && (
                    <Badge className="absolute top-0.5 right-0 h-[15px] min-w-[15px] text-[9px] bg-black text-white px-0.5 flex items-center justify-center rounded-full border-2 border-white">
                      {cartCount > 99 ? "99+" : cartCount}
                    </Badge>
                  )}
                </Link>
                {isLoggedIn ? (
                  <>
                    <Link href="/my" className="p-2" aria-label="마이페이지">
                      <div className="w-[22px] h-[22px] rounded-full bg-black text-white flex items-center justify-center text-[9px] font-bold">
                        {(session?.user?.name ?? "U").charAt(0).toUpperCase()}
                      </div>
                    </Link>
                    <LogoutButton variant="icon" className="p-2" />
                  </>
                ) : (
                  <Link href="/login" className="p-2 text-gray-600" aria-label="로그인">
                    <User className="w-[20px] h-[20px]" strokeWidth={1.8} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 모바일 검색 드롭다운 */}
        {searchOpen && (
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
            <form action="/search" className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchRef}
                name="q"
                placeholder="브랜드, 상품, 스타일 검색"
                className="w-full h-10 pl-10 pr-10 bg-[var(--paper)] border border-[var(--line)] rounded-none text-sm placeholder:text-[var(--ink-muted)]/60 focus:outline-none focus:border-[var(--ink)] focus:bg-white transition-all"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setSearchOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Category Menu Drawer */}
      <CategoryMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        brands={menuBrands}
        categories={menuCategories}
      />
    </>
  );
}
