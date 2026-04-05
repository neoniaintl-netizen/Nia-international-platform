"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CHANNELS, NAV_TABS } from "@/lib/constants";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function GNB() {
  const pathname = usePathname();

  return (
    <nav
      className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-16 z-40"
      aria-label="섹션 탭"
    >
      <div className="max-w-[1360px] mx-auto px-4 lg:px-8">
        {/* 모바일: 채널 가로 스크롤 */}
        <div className="lg:hidden">
          <ScrollArea className="w-full">
            <div className="flex items-center gap-4 h-10">
              {CHANNELS.map((channel) => {
                const isActive = channel.slug === "nkbus"
                  ? !pathname.includes("/category/")
                  : pathname.includes(`/category/${channel.slug}`);
                return (
                  <Link
                    key={channel.slug}
                    href={channel.slug === "nkbus" ? "/" : `/category/${channel.slug}`}
                    className={cn(
                      "text-[13px] font-semibold whitespace-nowrap transition-colors",
                      isActive ? "text-black" : "text-gray-400"
                    )}
                  >
                    {channel.displayName}
                  </Link>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>

        {/* 서브 탭 */}
        <ScrollArea className="w-full">
          <div className="flex items-center gap-7 h-11">
            {NAV_TABS.map((tab) => {
              const isActive =
                tab.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "relative text-[13px] font-medium whitespace-nowrap py-3 transition-colors",
                    isActive
                      ? "text-black font-semibold"
                      : "text-gray-400 hover:text-gray-700"
                  )}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-black rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>
    </nav>
  );
}
