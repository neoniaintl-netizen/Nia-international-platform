import Link from "next/link";
import { SectionHeader } from "@/components/home/section-header";

interface BrandItem {
  name: string;
  nameKo: string;
  slug: string;
  tagline: string;
  isOnboarded: boolean;
  /** 카드 배경 — Tailwind 가 아닌 inline gradient (브랜드별 톤 차이) */
  gradient: string;
  /** 텍스트 톤 — 오프화이트 배경엔 dark 텍스트 */
  tone: "light" | "dark";
}

interface BrandSpotlightProps {
  brands?: BrandItem[];
}

/**
 * Featured Brands — 6가지 다크톤 큐레이션 카드.
 * follower 더미 제거, 카드별 배경 그라디언트 차이로 구분감 + hover 시 살짝 밝아짐.
 */
const DEFAULT_FEATURED: BrandItem[] = [
  {
    name: "Titleist",
    nameKo: "타이틀리스트",
    slug: "titleist",
    tagline: "Heritage Performance Golf",
    isOnboarded: false,
    gradient:
      "linear-gradient(135deg, #1A1A1A 0%, #2C2C2C 60%, #1F1F1F 100%)",
    tone: "light",
  },
  {
    name: "PXG",
    nameKo: "피엑스지",
    slug: "pxg",
    tagline: "Precision Engineered",
    isOnboarded: false,
    gradient:
      "linear-gradient(135deg, #0A1628 0%, #1E3A5F 55%, #0F2540 100%)",
    tone: "light",
  },
  {
    name: "G/FORE",
    nameKo: "지포어",
    slug: "gfore",
    tagline: "Modern Golf Lifestyle",
    isOnboarded: false,
    gradient:
      "linear-gradient(135deg, #3D1A1F 0%, #5C2B2F 60%, #401C20 100%)",
    tone: "light",
  },
  {
    name: "Malbon Golf",
    nameKo: "말본골프",
    slug: "malbongolf",
    tagline: "Street Meets Course",
    isOnboarded: false,
    gradient:
      "linear-gradient(135deg, #0F2922 0%, #1F4438 60%, #122F26 100%)",
    tone: "light",
  },
  {
    name: "Mark & Lona",
    nameKo: "마크앤로나",
    slug: "markandlona-korea",
    tagline: "Luxury Golf Couture",
    isOnboarded: true,
    gradient:
      "linear-gradient(135deg, #F5F2EC 0%, #E8E2D6 60%, #EFEAE0 100%)",
    tone: "dark",
  },
  {
    name: "Anew Golf",
    nameKo: "어뉴골프",
    slug: "anewgolf",
    tagline: "Korean Premium Golf",
    isOnboarded: true,
    gradient:
      "linear-gradient(135deg, #0B1929 0%, #1A2D4A 60%, #112138 100%)",
    tone: "light",
  },
];

export function BrandSpotlight({
  brands = DEFAULT_FEATURED,
}: BrandSpotlightProps) {
  return (
    <section className="py-10 lg:py-20 bg-[var(--paper)]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
        <SectionHeader
          eyebrow="Curated Houses"
          title="Featured Brands"
          subtitle="지금 주목해야 할 골프 셀렉션"
          linkHref="/brands"
          linkLabel="All Brands"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {brands.map((brand, i) => {
            const href = brand.isOnboarded ? `/brands/${brand.slug}` : "/brands";
            const isDark = brand.tone === "dark";
            const textPrimary = isDark ? "text-[#1A1A1A]" : "text-white";
            const textSecondary = isDark ? "text-[#1A1A1A]/55" : "text-white/55";
            const textTertiary = isDark ? "text-[#1A1A1A]/45" : "text-white/45";
            const borderColor = isDark
              ? "border-[#1A1A1A]/15"
              : "border-white/15";
            const hoverArrow = isDark
              ? "group-hover:text-[#1A1A1A]"
              : "group-hover:text-white";

            return (
              <Link
                key={brand.slug}
                href={href}
                className="group block overflow-hidden aspect-[4/5] relative transition-transform duration-300 hover:-translate-y-0.5"
                style={{ background: brand.gradient }}
              >
                {/* hover 시 옅은 화이트 오버레이로 살짝 밝아짐 */}
                <div
                  className={`absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none ${
                    isDark ? "bg-black/[0.03]" : "bg-white/[0.06]"
                  }`}
                />
                <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <p
                      className={`eyebrow ${textSecondary} text-[10px] tracking-[0.2em]`}
                    >
                      NO.{String(i + 1).padStart(2, "0")}
                    </p>
                    {brand.isOnboarded && (
                      <span
                        className={`text-[9px] uppercase tracking-[0.18em] px-1.5 py-0.5 border ${borderColor} ${textSecondary}`}
                      >
                        Onboard
                      </span>
                    )}
                  </div>

                  <div>
                    <p
                      className={`${textPrimary} font-semibold text-[15px] md:text-[16px] tracking-[-0.005em] leading-snug`}
                    >
                      {brand.name}
                    </p>
                    <p className={`${textSecondary} text-[11px] mt-1`}>
                      {brand.nameKo}
                    </p>
                    <div
                      className={`mt-4 pt-4 border-t ${borderColor} flex items-center justify-between`}
                    >
                      <span
                        className={`${textTertiary} text-[10px] uppercase tracking-[0.13em]`}
                      >
                        {brand.tagline}
                      </span>
                      <span
                        className={`${textTertiary} ${hoverArrow} text-[11px] transition-all opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0`}
                      >
                        →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
