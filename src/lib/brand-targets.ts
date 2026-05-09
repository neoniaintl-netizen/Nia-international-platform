/**
 * 9개 브랜드 collection 페이지 매핑.
 * fill-brand-images 라우트가 각 brand의 collection을 fetch해서
 * 상품 이미지를 일괄 추출하는 데 사용한다.
 *
 * URL 선정 원칙:
 * - 한국 IP에서 200으로 응답하는 페이지
 * - 인기/베스트셀러 컬렉션 우선 — 가장 자주 보일 대표 이미지
 * - SSR로 상품 카드가 HTML에 포함된 페이지 (cheerio 추출 가능)
 */

export type BrandTarget = {
  brandSlug: string;
  brandName: string;
  category: "outdoor" | "sports";
  /** 이미지 추출에 사용할 collection 페이지 URL (1~3개) */
  collectionUrls: string[];
  /** 페이지 fetch 시 동반할 referer (CDN hotlink 차단 회피) */
  referer?: string;
  /** 사이트 플랫폼 (휴리스틱 분기에 사용) */
  platform: "shopify" | "cafe24" | "northface" | "kolon" | "nike" | "generic";
};

export const BRAND_TARGETS: BrandTarget[] = [
  // ─── 아웃도어 ───
  {
    brandSlug: "salomon",
    brandName: "Salomon",
    category: "outdoor",
    platform: "shopify",
    collectionUrls: [
      "https://salomon.co.kr/collections/sal-bestseller-all",
      "https://salomon.co.kr/collections/sal-all-shoes",
    ],
    referer: "https://salomon.co.kr/",
  },
  {
    brandSlug: "patagonia",
    brandName: "Patagonia",
    category: "outdoor",
    platform: "generic",
    collectionUrls: [
      "https://www.patagonia.co.kr/shop/mens.html",
      "https://www.patagonia.co.kr/shop/womens.html",
    ],
    referer: "https://www.patagonia.co.kr/",
  },
  {
    brandSlug: "arcteryx",
    brandName: "Arc'teryx",
    category: "outdoor",
    platform: "generic",
    collectionUrls: [
      "https://arcteryx.co.kr/men/jacket",
      "https://arcteryx.co.kr/women/jacket",
    ],
    referer: "https://arcteryx.co.kr/",
  },
  {
    brandSlug: "thenorthface",
    brandName: "The North Face",
    category: "outdoor",
    platform: "northface",
    collectionUrls: [
      "https://www.thenorthfacekorea.co.kr/category/n/men/jacket-vest",
      "https://www.thenorthfacekorea.co.kr/category/n/women/jacket-vest",
    ],
    referer: "https://www.thenorthfacekorea.co.kr/",
  },
  {
    brandSlug: "kolonsport",
    brandName: "Kolon Sport",
    category: "outdoor",
    platform: "kolon",
    collectionUrls: [
      "https://www.kolonsport.com/category/men/jacket",
      "https://www.kolonsport.com/category/women/jacket",
    ],
    referer: "https://www.kolonsport.com/",
  },

  // ─── 스포츠 ───
  {
    brandSlug: "descente",
    brandName: "DESCENTE",
    category: "sports",
    platform: "cafe24",
    collectionUrls: [
      "https://dk-on.com/category/descente/men",
      "https://dk-on.com/category/descente/women",
    ],
    referer: "https://dk-on.com/",
  },
  {
    brandSlug: "wilson",
    brandName: "Wilson",
    category: "sports",
    platform: "shopify",
    collectionUrls: [
      "https://kr.wilson.com/collections/women-shoes-all",
      "https://kr.wilson.com/collections/men-shoes-all",
    ],
    referer: "https://kr.wilson.com/",
  },
  {
    brandSlug: "aloyoga",
    brandName: "Alo Yoga",
    category: "sports",
    platform: "shopify",
    // 한국어 페이지 — 글로벌(www.aloyoga.com)은 한국 IP 403 차단되므로 ko-kr 사용
    collectionUrls: [
      "https://www.aloyoga.com/ko-kr/collections/leggings",
      "https://www.aloyoga.com/ko-kr/collections/bestsellers",
    ],
    referer: "https://www.aloyoga.com/ko-kr/",
  },
  {
    brandSlug: "nike-skims",
    brandName: "Nike × SKIMS",
    category: "sports",
    platform: "nike",
    collectionUrls: ["https://www.nike.com/kr/nikeskims"],
    referer: "https://www.nike.com/",
  },
];

/** brandSlug로 target 찾기 */
export function getBrandTarget(brandSlug: string): BrandTarget | undefined {
  return BRAND_TARGETS.find((t) => t.brandSlug === brandSlug);
}
