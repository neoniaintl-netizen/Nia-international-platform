import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

interface CategoryCard {
  label: string;
  subLabel?: string;
  description?: string;
  href: string;
  /** 이미지 경로. 없으면 미니멀 그라디언트 카드로 렌더 */
  imageUrl?: string;
  badge?: string;
}

/**
 * 카테고리 쇼케이스 — 3 × 2 그리드 (lg) / 2 × 3 (md) / 1열 (mobile).
 * 이미지 있는 카드: object-cover + bottom 그라디언트 오버레이.
 * 이미지 없는 카드: 미니멀 다크 그라디언트 + 큰 타이포.
 * 기본 4개 카드는 subLabel(Channel)·description(Home) 번역 키로 렌더.
 * 사용자가 이미지 추가하면 imageUrl 만 채우면 됨.
 */
export function CategoryShowcase({
  categories,
}: {
  categories?: CategoryCard[];
}) {
  const t = useTranslations("Home");
  const tc = useTranslations("Channel");

  const defaultCategories: CategoryCard[] = [
    {
      label: "Golf",
      subLabel: tc("golf"),
      description: t("catGolfDesc"),
      href: "/category/golf",
      imageUrl: "/categories/golf.png",
      badge: "Featured",
    },
    {
      label: "Sports",
      subLabel: tc("sports"),
      description: t("catSportsDesc"),
      href: "/category/sports",
      imageUrl: "/categories/sports.png",
    },
    {
      label: "Outdoor",
      subLabel: tc("outdoor"),
      description: t("catOutdoorDesc"),
      href: "/category/outdoor",
      imageUrl: "/categories/outdoor.png",
    },
    {
      label: "Women",
      subLabel: tc("women"),
      description: t("catWomenDesc"),
      href: "/category/women",
      imageUrl: "/categories/women.png",
    },
  ];
  const cards = categories ?? defaultCategories;

  return (
    <section className="py-14 lg:py-20 bg-[var(--paper)]">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        {/* 섹션 헤더 */}
        <div className="mb-10 lg:mb-14 text-center">
          <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--ink-muted)] mb-3">
            Shop by Category
          </p>
          <h2 className="text-3xl lg:text-5xl font-bold tracking-[-0.02em] text-[var(--ink)]">
            Explore Categories
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {cards.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="group relative block aspect-[4/5] overflow-hidden bg-[var(--ink)]"
            >
              {cat.imageUrl ? (
                <>
                  <Image
                    src={cat.imageUrl}
                    alt={cat.label}
                    fill
                    priority
                    unoptimized
                    className="object-cover transition-transform duration-[700ms] ease-out group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
                </>
              ) : (
                // 이미지 없는 카드 — 미니멀 다크 그라디언트
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#3a3a3a] transition-transform duration-[700ms] ease-out group-hover:scale-[1.04]">
                  <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_30%_20%,white,transparent_60%)]" />
                </div>
              )}

              {cat.badge && (
                <div className="absolute top-4 left-4 px-2.5 py-1 bg-white/95 text-[var(--ink)] text-[10px] font-medium uppercase tracking-[0.18em]">
                  {cat.badge}
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                {cat.subLabel && (
                  <p className="text-[10px] md:text-[11px] uppercase tracking-[0.25em] text-white/70 mb-2">
                    {cat.subLabel}
                  </p>
                )}
                <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-[-0.02em] leading-[0.95] mb-2">
                  {cat.label}
                </h3>
                {cat.description && (
                  <p className="text-[12px] md:text-[13px] text-white/75 mb-4 line-clamp-1">
                    {cat.description}
                  </p>
                )}
                <div className="inline-flex items-center gap-2 text-[10px] md:text-[11px] font-medium uppercase tracking-[0.22em] pb-1 border-b border-white/50 group-hover:border-white transition-colors">
                  Shop Now
                  <ArrowRight
                    className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={1.5}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
