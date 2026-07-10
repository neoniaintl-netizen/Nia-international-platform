import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { CHANNELS } from "@/lib/constants";
import { SectionHeader } from "@/components/home/section-header";

/**
 * 카테고리 진입 그리드 (섹션 3).
 * 데이터 = 실제 채널(CHANNELS: 골프/스포츠/아웃도어/뷰티/여성) → /category/{slug} 로 이동.
 * 이미지 자산이 없으므로 무채색 타이포 타일(에디토리얼 톤)로 구성.
 * 다국어: Channel 네임스페이스 번역 사용(헤더 GNB와 동일 소스).
 */
export async function CategoryGrid() {
  const tCh = await getTranslations("Channel");
  const t = await getTranslations("Home");

  return (
    <section className="max-w-[1360px] mx-auto px-4 lg:px-8 py-12 lg:py-20">
      <SectionHeader
        eyebrow="Categories"
        title={t("v2CategoriesTitle")}
        subtitle={t("v2CategoriesSubtitle")}
        linkHref="/category"
        linkLabel="All"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
        {CHANNELS.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="group relative flex flex-col justify-between h-32 lg:h-44 border border-[var(--line)] p-4 lg:p-5 hover:border-[var(--ink)] transition-colors"
          >
            <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
              {c.name}
            </span>
            <div className="flex items-end justify-between">
              <span className="text-base lg:text-xl tracking-tight text-[var(--ink)]">
                {tCh(c.slug)}
              </span>
              <ArrowUpRight
                className="w-4 h-4 text-[var(--ink-muted)] group-hover:text-[var(--ink)] transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={1.5}
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
