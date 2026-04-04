"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CHANNELS, NAV_TABS } from "@/lib/constants";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function GNB() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-14 z-40">
      <div className="max-w-[1280px] mx-auto">
        {/* Channel tabs */}
        <ScrollArea className="w-full">
          <div className="flex items-center gap-1 px-4 lg:px-6 h-10">
            {CHANNELS.slice(0, 5).map((channel) => (
              <Link
                key={channel.slug}
                href={`/?channel=${channel.slug}`}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-colors",
                  channel.slug === "nkbus"
                    ? "bg-black text-white"
                    : "text-gray-500 hover:bg-gray-100"
                )}
              >
                {channel.displayName}
              </Link>
            ))}
            <span className="text-gray-200 mx-1">|</span>
            {CHANNELS.slice(5).map((channel) => (
              <Link
                key={channel.slug}
                href={`/?channel=${channel.slug}`}
                className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 whitespace-nowrap transition-colors"
              >
                {channel.displayName}
              </Link>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>

        {/* Sub navigation tabs */}
        <div className="flex items-center px-4 lg:px-6 border-t border-gray-50">
          <ScrollArea className="w-full">
            <div className="flex items-center gap-6 h-11">
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
                      "text-sm font-medium whitespace-nowrap py-3 border-b-2 transition-colors",
                      isActive
                        ? "border-black text-black"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    )}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>
      </div>
    </nav>
  );
}
