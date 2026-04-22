/**
 * 골프 브랜드 목록 + 서브 카테고리 매핑
 *
 * 크롤링 대상:
 *   Phase 1 (Easy): 마크앤로나·사우스케이프·어뉴·아이스버그·UTAA·펠트·지포어·더카트·데상트골프·PXG
 */

export interface GolfBrandConfig {
  slug: string;
  name: string;
  nameKo: string;
  description: string;
  sourceSite: string; // 크롤러 id
  /** 카테고리별 리스팅 URL + 우리 서브카테고리 slug 매핑 */
  categories: {
    sourceUrl: string;
    subCategorySlug: string; // golf-top | golf-bottom | ...
  }[];
}

/** 골프 내부 9개 서브카테고리 (depth=1, parent=golf) */
export const GOLF_SUB_CATEGORIES = [
  { slug: "golf-top", name: "상의", sortOrder: 1 },
  { slug: "golf-bottom", name: "하의", sortOrder: 2 },
  { slug: "golf-outer", name: "아우터", sortOrder: 3 },
  { slug: "golf-shoes", name: "골프화", sortOrder: 4 },
  { slug: "golf-cap", name: "모자·바이저", sortOrder: 5 },
  { slug: "golf-bag", name: "가방", sortOrder: 6 },
  { slug: "golf-acc", name: "액세서리", sortOrder: 7 },
  { slug: "golf-club", name: "클럽", sortOrder: 8 },
  { slug: "golf-ball", name: "골프공", sortOrder: 9 },
] as const;

export const GOLF_BRANDS: GolfBrandConfig[] = [
  {
    slug: "mark-lona",
    name: "Mark & Lona",
    nameKo: "마크앤로나",
    description: "프리미엄 골프 라이프스타일 · 일본 발 럭셔리 골프웨어",
    sourceSite: "shopify",
    categories: [
      { sourceUrl: "https://markandlona-korea.co.kr/collections/man-outer", subCategorySlug: "golf-outer" },
      { sourceUrl: "https://markandlona-korea.co.kr/collections/man-top", subCategorySlug: "golf-top" },
      { sourceUrl: "https://markandlona-korea.co.kr/collections/man-bottom", subCategorySlug: "golf-bottom" },
      { sourceUrl: "https://markandlona-korea.co.kr/collections/shoes", subCategorySlug: "golf-shoes" },
      { sourceUrl: "https://markandlona-korea.co.kr/collections/hat", subCategorySlug: "golf-cap" },
    ],
  },
  {
    slug: "southcape",
    name: "South Cape",
    nameKo: "사우스케이프",
    description: "골프 & 리조트 · 한국 프리미엄 골프웨어 에디토리얼",
    sourceSite: "godomall",
    categories: [
      { sourceUrl: "https://southcape.shop/goods/goods_list.php?cateCd=001001", subCategorySlug: "golf-outer" },
      { sourceUrl: "https://southcape.shop/goods/goods_list.php?cateCd=001002", subCategorySlug: "golf-top" },
      { sourceUrl: "https://southcape.shop/goods/goods_list.php?cateCd=001003", subCategorySlug: "golf-bottom" },
      { sourceUrl: "https://southcape.shop/goods/goods_list.php?cateCd=001004001", subCategorySlug: "golf-cap" },
      { sourceUrl: "https://southcape.shop/goods/goods_list.php?cateCd=001004002", subCategorySlug: "golf-shoes" },
      { sourceUrl: "https://southcape.shop/goods/goods_list.php?cateCd=001004004", subCategorySlug: "golf-bag" },
    ],
  },
  {
    slug: "anewgolf",
    name: "ANEW Golf",
    nameKo: "어뉴골프",
    description: "모던 골프 스타일 · 스트리트 감성의 골프웨어",
    sourceSite: "cafe24",
    categories: [
      { sourceUrl: "https://anewgolf.com/product/list.html?cate_no=1254", subCategorySlug: "golf-top" },
      { sourceUrl: "https://anewgolf.com/product/list.html?cate_no=1255", subCategorySlug: "golf-bottom" },
      { sourceUrl: "https://anewgolf.com/product/list.html?cate_no=1256", subCategorySlug: "golf-outer" },
      { sourceUrl: "https://anewgolf.com/product/list.html?cate_no=1632", subCategorySlug: "golf-shoes" },
      { sourceUrl: "https://anewgolf.com/product/list.html?cate_no=1312", subCategorySlug: "golf-cap" },
      { sourceUrl: "https://anewgolf.com/product/list.html?cate_no=801", subCategorySlug: "golf-bag" },
    ],
  },
  {
    slug: "iceberg-golf",
    name: "Iceberg Golf",
    nameKo: "아이스버그 골프",
    description: "컬러풀한 골프 스트리트 웨어",
    sourceSite: "cafe24",
    categories: [
      { sourceUrl: "https://iceberggolf.com/product/list.html?cate_no=32", subCategorySlug: "golf-outer" },
      { sourceUrl: "https://iceberggolf.com/product/list.html?cate_no=44", subCategorySlug: "golf-bottom" },
      { sourceUrl: "https://iceberggolf.com/product/list.html?cate_no=64", subCategorySlug: "golf-cap" },
      { sourceUrl: "https://iceberggolf.com/product/list.html?cate_no=34", subCategorySlug: "golf-bag" },
      { sourceUrl: "https://iceberggolf.com/product/list.html?cate_no=113", subCategorySlug: "golf-shoes" },
    ],
  },
  {
    slug: "utaa",
    name: "UTAA",
    nameKo: "유타",
    description: "아반가르드 골프 브랜드 · 컬러 블록 디자인",
    sourceSite: "cafe24",
    categories: [
      { sourceUrl: "https://utaagolf.com/product/list.html?cate_no=24", subCategorySlug: "golf-top" },
      { sourceUrl: "https://utaagolf.com/product/list.html?cate_no=25", subCategorySlug: "golf-top" },
      { sourceUrl: "https://utaagolf.com/product/list.html?cate_no=45", subCategorySlug: "golf-top" },
    ],
  },
  {
    slug: "pelt",
    name: "PELT",
    nameKo: "펠트",
    description: "미니멀 골프 · 친환경 소재 중심",
    sourceSite: "cafe24",
    categories: [
      { sourceUrl: "https://peltgolf.com/product/list.html?cate_no=72", subCategorySlug: "golf-outer" },
      { sourceUrl: "https://peltgolf.com/product/list.html?cate_no=73", subCategorySlug: "golf-top" },
      { sourceUrl: "https://peltgolf.com/product/list.html?cate_no=79", subCategorySlug: "golf-bottom" },
      { sourceUrl: "https://peltgolf.com/product/list.html?cate_no=58", subCategorySlug: "golf-shoes" },
    ],
  },
  {
    slug: "gfore",
    name: "G/FORE",
    nameKo: "지포어",
    description: "Disruptive Luxury Golf · 프리미엄 골프웨어의 아이콘",
    sourceSite: "gfore",
    categories: [
      { sourceUrl: "https://www.gfore.kr/Category/List/506010010000?inStock=true", subCategorySlug: "golf-top" },
      { sourceUrl: "https://www.gfore.kr/Category/List/506010020000?inStock=true", subCategorySlug: "golf-top" },
      { sourceUrl: "https://www.gfore.kr/Category/List/506010030000?inStock=true", subCategorySlug: "golf-shoes" },
    ],
  },
  {
    slug: "thecart",
    name: "THE CART",
    nameKo: "더카트",
    description: "프리미엄 골프 편집샵 · 큐레이티드 셀렉션",
    sourceSite: "thecart",
    categories: [
      { sourceUrl: "https://www.thecart.co.kr/product/all/men/outer", subCategorySlug: "golf-outer" },
      { sourceUrl: "https://www.thecart.co.kr/product/all/men/shirts", subCategorySlug: "golf-top" },
      { sourceUrl: "https://www.thecart.co.kr/product/all/men/sweater", subCategorySlug: "golf-outer" },
      { sourceUrl: "https://www.thecart.co.kr/product/all/men/pants", subCategorySlug: "golf-bottom" },
      { sourceUrl: "https://www.thecart.co.kr/product/all/women/outer", subCategorySlug: "golf-outer" },
      { sourceUrl: "https://www.thecart.co.kr/product/all/women/shirts", subCategorySlug: "golf-top" },
    ],
  },
  {
    slug: "descente-golf",
    name: "Descente Golf",
    nameKo: "데상트 골프",
    description: "일본 퍼포먼스 스포츠 · 골프 라인",
    sourceSite: "dkon",
    categories: [
      { sourceUrl: "https://dk-on.com/DESCENTEGOLF/category/201000000", subCategorySlug: "golf-top" },
      { sourceUrl: "https://dk-on.com/DESCENTEGOLF/category/202000000", subCategorySlug: "golf-top" },
      { sourceUrl: "https://dk-on.com/DESCENTEGOLF/category/203000000", subCategorySlug: "golf-shoes" },
      { sourceUrl: "https://dk-on.com/DESCENTEGOLF/category/204000000", subCategorySlug: "golf-acc" },
    ],
  },
  {
    slug: "pxg",
    name: "PXG",
    nameKo: "피엑스지",
    description: "혁신의 골프 엔지니어링 · 어패럴 & 클럽",
    sourceSite: "pxg",
    categories: [
      { sourceUrl: "https://www.pxg.co.kr/product/list.asp?cno=106", subCategorySlug: "golf-top" },
      { sourceUrl: "https://www.pxg.co.kr/product/list.asp?cno=121", subCategorySlug: "golf-top" },
      { sourceUrl: "https://www.pxg.co.kr/product/list.asp?cno=116", subCategorySlug: "golf-outer" },
      { sourceUrl: "https://www.pxg.co.kr/product/list.asp?cno=100", subCategorySlug: "golf-top" },
      { sourceUrl: "https://www.pxg.co.kr/product/list.asp?cno=101", subCategorySlug: "golf-top" },
    ],
  },
];

/** sourceUrl → 우리 서브카테고리 slug 역추적 */
export function resolveGolfSubCategoryFromSourceUrl(
  sourceUrl: string
): string | null {
  for (const brand of GOLF_BRANDS) {
    for (const cat of brand.categories) {
      // 경로 + 쿼리로 일치 비교
      if (sourceUrl.startsWith(cat.sourceUrl.split("?")[0])) {
        // 쿼리가 있으면 정확 매치
        if (cat.sourceUrl.includes("?")) {
          const catQueryKey = new URL(cat.sourceUrl).searchParams.keys().next().value;
          if (catQueryKey) {
            const expectedVal = new URL(cat.sourceUrl).searchParams.get(catQueryKey);
            const actualVal = new URL(sourceUrl).searchParams.get(catQueryKey);
            if (expectedVal === actualVal) return cat.subCategorySlug;
          }
        } else {
          return cat.subCategorySlug;
        }
      }
    }
  }
  return null;
}
