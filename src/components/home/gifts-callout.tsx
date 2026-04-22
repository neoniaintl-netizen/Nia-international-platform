import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

/**
 * G/FORE 스타일 GIFTS 2-card callout
 * 가격대별 / 대상별 선물 큐레이션 바로가기
 */
export function GiftsCallout() {
  const gifts = [
    {
      label: "Gifts for Him",
      subLabel: "그를 위한 선물",
      href: "/gifts?audience=him",
      imageUrl:
        "https://placehold.co/1200x900/1F3F2F/ffffff?font=inter&text=GIFTS+FOR+HIM",
    },
    {
      label: "Gifts for Her",
      subLabel: "그녀를 위한 선물",
      href: "/gifts?audience=her",
      imageUrl:
        "https://placehold.co/1200x900/4A7C59/0a0a0a?font=inter&text=GIFTS+FOR+HER",
    },
  ];

  return (
    <section className="py-10 lg:py-16">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="mb-6 lg:mb-8">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--champagne)] font-medium mb-2">
            Curated Gifts
          </p>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Gift Guide
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {gifts.map((g) => (
            <Link
              key={g.href}
              href={g.href}
              className="group relative block aspect-[4/3] overflow-hidden"
            >
              <Image
                src={g.imageUrl}
                alt={g.label}
                fill
                className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.02]"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/70 mb-2">
                  {g.subLabel}
                </p>
                <h3 className="text-2xl md:text-4xl font-bold tracking-tight mb-3">
                  {g.label}
                </h3>
                <div className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] pb-1 border-b border-white/60 group-hover:border-white">
                  Shop Gifts
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
