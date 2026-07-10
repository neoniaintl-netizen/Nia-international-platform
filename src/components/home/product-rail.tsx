import { ProductCard, type ProductCardData } from "@/components/product/product-card";
import { SectionHeader } from "@/components/home/section-header";

interface ProductRailProps {
  products: ProductCardData[];
  eyebrow?: string;
  title: string;
  subtitle?: string;
  linkHref?: string;
  linkLabel?: string;
  /** 카드에 1..N 순위 번호(No.01) 배지 표시 */
  numbered?: boolean;
}

/**
 * 가로 스크롤(스냅) 상품 레일 — 모바일 스와이프 · 데스크톱 트랙패드/드래그.
 * 서버 컴포넌트(네이티브 overflow 스크롤이라 클라이언트 상태 불필요).
 * 카드는 사이트 공통 ProductCard 단일 컴포넌트를 재사용.
 */
export function ProductRail({
  products,
  eyebrow,
  title,
  subtitle,
  linkHref,
  linkLabel,
  numbered = false,
}: ProductRailProps) {
  if (products.length === 0) return null;

  return (
    <section className="max-w-[1360px] mx-auto px-4 lg:px-8 py-12 lg:py-20">
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        linkHref={linkHref}
        linkLabel={linkLabel}
      />
      {/* 모바일에서 화면 끝까지 흘려보내는 bleed(-mx-4) → 스와이프 감 강조 */}
      <div className="-mx-4 px-4 lg:mx-0 lg:px-0">
        <div className="flex gap-3 sm:gap-4 lg:gap-5 overflow-x-auto snap-x snap-mandatory pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map((p, i) => (
            <div
              key={p.id}
              className="snap-start shrink-0 w-[44vw] sm:w-[240px] lg:w-[262px]"
            >
              <ProductCard
                product={p}
                rank={numbered ? i + 1 : undefined}
                priority={i < 4}
              />
            </div>
          ))}
          {/* 우측 끝 여백(마지막 카드가 화면 끝에 붙지 않게) */}
          <div className="shrink-0 w-1 lg:hidden" aria-hidden />
        </div>
      </div>
    </section>
  );
}
