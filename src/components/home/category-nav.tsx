import Link from "next/link";
import { Dumbbell, Mountain, Sparkles, Shirt } from "lucide-react";

/** 골프 아이콘 (커스텀 SVG) */
function GolfIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="18" r="2" />
      <path d="M12 2v14" />
      <path d="M12 2l6 4-6 4" />
    </svg>
  );
}

const categories = [
  { label: "Golf", sub: "골프", slug: "golf", icon: GolfIcon },
  { label: "Sports", sub: "스포츠", slug: "sports", icon: Dumbbell },
  { label: "Outdoor", sub: "아웃도어", slug: "outdoor", icon: Mountain },
  { label: "Beauty", sub: "뷰티", slug: "beauty", icon: Sparkles },
  { label: "Women", sub: "여성의류", slug: "women", icon: Shirt },
];

export function CategoryNav() {
  return (
    <section className="py-10 lg:py-14 border-b border-[var(--line)]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-5 gap-3 md:gap-6">
          {categories.map(({ label, sub, slug, icon: Icon }) => (
            <Link
              key={slug}
              href={`/category/${slug}`}
              className="group flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 border border-[var(--line)] flex items-center justify-center group-hover:border-[var(--ink)] transition-colors">
                <Icon
                  className="w-6 h-6 md:w-7 md:h-7 text-[var(--ink)]"
                  strokeWidth={1.2}
                />
              </div>
              <div className="text-center">
                <p className="text-[11px] uppercase tracking-[0.15em] font-medium text-[var(--ink)]">
                  {label}
                </p>
                <p className="text-[10px] text-[var(--ink-muted)] mt-0.5 hidden md:block">
                  {sub}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
