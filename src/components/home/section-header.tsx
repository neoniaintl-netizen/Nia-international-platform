import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  linkHref?: string;
  linkLabel?: string;
}

/**
 * 프리미엄 에디토리얼 스타일의 공통 섹션 헤더.
 * eyebrow(작은 캡션) · title(큰 영문/한글) · subtitle(설명) 3단 구조 + See all 링크.
 */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  linkHref,
  linkLabel = "See All",
}: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-6 lg:mb-10 pb-3 lg:pb-4 border-b border-[var(--line)]">
      <div>
        {eyebrow && (
          <p className="eyebrow text-[var(--champagne)] mb-2">{eyebrow}</p>
        )}
        <h2 className="text-xl lg:text-2xl font-normal tracking-tight text-[var(--ink)]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[12px] text-[var(--ink-muted)] mt-1.5">
            {subtitle}
          </p>
        )}
      </div>
      {linkHref && (
        <Link
          href={linkHref}
          className="group flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--ink)] pb-0.5 border-b border-[var(--ink)] hover:text-[var(--champagne)] hover:border-[var(--champagne)] transition-colors shrink-0 ml-4"
        >
          {linkLabel}
          <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
        </Link>
      )}
    </div>
  );
}
