import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BrandItem {
  name: string;
  nameKo: string;
  slug: string;
  logoUrl: string | null;
  followerCount: number;
}

const BG_COLORS = ["#1a1a1a", "#2d3436", "#636e72", "#111", "#000", "#2C2C2C"];

interface BrandSpotlightProps {
  brands: BrandItem[];
}

export function BrandSpotlight({ brands }: BrandSpotlightProps) {
  return (
    <section className="py-8">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">브랜드 추천</h2>
          <Link
            href="/brands"
            className="text-xs text-gray-400 flex items-center gap-0.5 hover:text-black transition-colors"
          >
            전체 브랜드
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {brands.map((brand, i) => (
            <Link
              key={brand.slug}
              href={`/brands/${brand.slug}`}
              className="group rounded-xl overflow-hidden"
              style={{ backgroundColor: BG_COLORS[i % BG_COLORS.length] }}
            >
              <div className="p-4 md:p-5 flex flex-col justify-between aspect-square">
                <div>
                  <p className="text-white font-bold text-sm">{brand.name}</p>
                  <p className="text-white/50 text-xs mt-0.5">{brand.nameKo}</p>
                </div>
                <p className="text-white/60 text-xs group-hover:text-white/80 transition-colors">
                  팔로워 {(brand.followerCount / 10000).toFixed(1)}만
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
