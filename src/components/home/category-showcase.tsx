import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface CategoryCard {
  label: string;
  subLabel?: string;
  href: string;
  imageUrl: string;
  badge?: string;
}

const DEFAULT_CATEGORIES: CategoryCard[] = [
  {
    label: "Outdoor",
    subLabel: "아웃도어",
    href: "/category/outdoor",
    imageUrl:
      "https://placehold.co/1000x1300/1F3F2F/f5e9d3?font=inter&text=OUTDOOR",
    badge: "Featured",
  },
  {
    label: "Sports",
    subLabel: "스포츠",
    href: "/category/sports",
    imageUrl:
      "https://placehold.co/1000x1300/2A4D3A/f5e9d3?font=inter&text=SPORTS",
  },
  {
    label: "Golf",
    subLabel: "골프",
    href: "/category/golf",
    imageUrl:
      "https://placehold.co/1000x1300/2D5E3F/f5e9d3?font=inter&text=GOLF",
    badge: "New",
  },
  {
    label: "Women",
    subLabel: "여성의류",
    href: "/category/women",
    imageUrl:
      "https://placehold.co/1000x1300/4A7C59/0a0a0a?font=inter&text=WOMEN",
  },
];

/**
 * G/FORE 스타일 2x2 카테고리 쇼케이스 카드
 * 각 카드 = 풀폭 이미지 + 호버 시 SHOP NOW 노출
 */
export function CategoryShowcase({
  categories = DEFAULT_CATEGORIES,
}: {
  categories?: CategoryCard[];
}) {
  return (
    <section className="py-10 lg:py-16 bg-[var(--paper)]">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="group relative block aspect-[4/5] md:aspect-[5/6] overflow-hidden"
            >
              <Image
                src={cat.imageUrl}
                alt={cat.label}
                fill
                className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.02]"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

              {cat.badge && (
                <div className="absolute top-5 left-5 px-2.5 py-1 bg-white/90 text-[var(--ink)] text-[10px] font-medium uppercase tracking-[0.15em]">
                  {cat.badge}
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
                {cat.subLabel && (
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/70 mb-2">
                    {cat.subLabel}
                  </p>
                )}
                <h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
                  {cat.label}
                </h3>
                <div className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] pb-1 border-b border-white/60 group-hover:border-white transition-colors">
                  Shop Now
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
