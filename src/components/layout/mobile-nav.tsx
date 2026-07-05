"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Home, LayoutGrid, Search, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { labelKey: "home", href: "/", icon: Home },
  { labelKey: "category", href: "/category", icon: LayoutGrid },
  { labelKey: "search", href: "/search", icon: Search },
  { labelKey: "wishlist", href: "/wishlist", icon: Heart },
  { labelKey: "my", href: "/my", icon: User },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations("MobileNav");

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-2">
        {items.map(({ labelKey, href, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1",
                isActive ? "text-black" : "text-gray-400"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px]">{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
