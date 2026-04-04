import Link from "next/link";
import { Shirt, Wind, Footprints, Watch, Gem, Glasses, ShoppingBag, Sparkles } from "lucide-react";

const categories = [
  { label: "상의", slug: "tops", icon: Shirt },
  { label: "아우터", slug: "outer", icon: Wind },
  { label: "바지", slug: "pants", icon: Shirt },
  { label: "신발", slug: "shoes", icon: Footprints },
  { label: "가방", slug: "bags", icon: ShoppingBag },
  { label: "시계", slug: "watches", icon: Watch },
  { label: "주얼리", slug: "jewelry", icon: Gem },
  { label: "액세서리", slug: "accessories", icon: Glasses },
];

export function CategoryNav() {
  return (
    <section className="py-6">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
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
