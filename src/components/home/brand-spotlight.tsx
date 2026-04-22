import Link from "next/link";
import { SectionHeader } from "@/components/home/section-header";

interface BrandItem {
  name: string;
  nameKo: string;
  slug: string;
  logoUrl: string | null;
  followerCount: number;
}

// 2가지 다크톤 교차 사용 (검정, 다크 네이비) — 에디토리얼 균일성
const BG_COLORS = ["#0A0A0A", "#0F1C2E"];

interface BrandSpotlightProps {
  brands: BrandItem[];
}

export function BrandSpotlight({ brands }: BrandSpotlightProps) {
  return (
    <section className="py-10 lg:py-20 bg-[var(--paper)]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
        <SectionHeader
          eyebrow="Curated Houses"
          title="Featured Brands"
          subtitle="엄선된 브랜드 큐레이션"
          linkHref="/brands"
          linkLabel="All Brands"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {brands.map((brand, i) => (
            <Link
              key={brand.slug}
              href={`/brands/${brand.slug}`}
              className="group block overflow-hidden aspect-[4/5] relative"
              style={{ backgroundColor: BG_COLORS[i % BG_COLORS.length] }}
            >
              <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-between">
                <div>
                  <p className="eyebrow text-white/60">No.{String(i + 1).padStart(2, "0")}</p>
                </div>
                <div>
                  <p className="text-white font-medium text-[15px] tracking-[0.02em]">
                    {brand.name}
                  </p>
                  <p className="text-white/50 text-[11px] mt-1">{brand.nameKo}</p>
                  <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-white/60 group-hover:text-white transition-colors">
                    <span>
                      <span className="num">
                        {brand.followerCount.toLocaleString()}
                      </span>{" "}
                      Followers
                    </span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
