import Link from "next/link";
import { Dumbbell, Mountain, Sparkles, Shirt } from "lucide-react";

/** 골프 아이콘 (커스텀 SVG) */
function GolfIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="18" r="2" />
      <path d="M12 2v14" />
      <path d="M12 2l6 4-6 4" />
    </svg>
  );
}

const categories = [
  { label: "골프", slug: "golf", icon: GolfIcon },
  { label: "스포츠", slug: "sports", icon: Dumbbell },
  { label: "아웃도어", slug: "outdoor", icon: Mountain },
  { label: "뷰티", slug: "beauty", icon: Sparkles },
  { label: "여성의류", slug: "women", icon: Shirt },
];

export function CategoryNav() {
  return (
    <section className="py-6">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-5 gap-4">
          {categories.map(({ label, slug, icon: Icon }) => (
            <Link
              key={slug}
              href={`/category/${slug}`}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                <Icon className="w-6 h-6 text-gray-600" strokeWidth={1.5} />
              </div>
              <span className="text-xs text-gray-600 group-hover:text-black transition-colors">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
