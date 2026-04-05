export const SITE_NAME = "NKBUS";
export const SITE_DESCRIPTION = "중국 수출 구매대행 & 패션 플랫폼";

export const CHANNELS = [
  { name: "NKBUS", slug: "nkbus", displayName: "NKBUS", color: "#000000" },
  { name: "GOLF", slug: "golf", displayName: "골프", color: "#2D7D46" },
  { name: "SPORTS", slug: "sports", displayName: "스포츠", color: "#0066FF" },
  { name: "OUTDOOR", slug: "outdoor", displayName: "아웃도어", color: "#FF8C00" },
  { name: "BEAUTY", slug: "beauty", displayName: "뷰티", color: "#FF6B9D" },
  { name: "WOMEN", slug: "women", displayName: "여성의류", color: "#9B59B6" },
] as const;

export const NAV_TABS = [
  { label: "추천", href: "/" },
  { label: "랭킹", href: "/ranking" },
  { label: "세일", href: "/products?sort=sale" },
  { label: "발매", href: "/release" },
  { label: "매거진", href: "/magazine" },
] as const;

/** 대분류 카테고리 + 하위 카테고리 */
export const CATEGORY_TREE = [
  {
    name: "골프",
    slug: "golf",
    icon: "golf" as const,
    sub: [
      { name: "드라이버", slug: "driver" },
      { name: "아이언", slug: "iron" },
      { name: "퍼터", slug: "putter" },
      { name: "웨지", slug: "wedge" },
      { name: "골프웨어", slug: "golf-wear" },
      { name: "골프백", slug: "golf-bag" },
      { name: "골프공", slug: "golf-ball" },
      { name: "골프장갑", slug: "golf-glove" },
      { name: "골프화", slug: "golf-shoes" },
    ],
  },
  {
    name: "스포츠",
    slug: "sports",
    icon: "sports" as const,
    sub: [
      { name: "러닝", slug: "running" },
      { name: "트레이닝", slug: "training" },
      { name: "수영", slug: "swimming" },
      { name: "테니스/배드민턴", slug: "racket" },
      { name: "축구/풋살", slug: "football" },
      { name: "농구", slug: "basketball" },
      { name: "스포츠웨어", slug: "sportswear" },
      { name: "스포츠용품", slug: "sports-gear" },
    ],
  },
  {
    name: "아웃도어",
    slug: "outdoor",
    icon: "outdoor" as const,
    sub: [
      { name: "등산", slug: "hiking" },
      { name: "캠핑", slug: "camping" },
      { name: "낚시", slug: "fishing" },
      { name: "아웃도어웨어", slug: "outdoor-wear" },
      { name: "아웃도어용품", slug: "outdoor-gear" },
      { name: "자전거", slug: "cycling" },
    ],
  },
  {
    name: "뷰티",
    slug: "beauty",
    icon: "beauty" as const,
    sub: [
      { name: "스킨케어", slug: "skincare" },
      { name: "선케어", slug: "suncare" },
      { name: "클렌징/필링", slug: "cleansing" },
      { name: "헤어케어", slug: "haircare" },
      { name: "바디케어", slug: "bodycare" },
      { name: "프레그런스", slug: "fragrance" },
      { name: "메이크업", slug: "makeup" },
      { name: "미용소품", slug: "beauty-tools" },
      { name: "헬스/푸드", slug: "health-food" },
    ],
  },
  {
    name: "여성의류",
    slug: "women",
    icon: "women" as const,
    sub: [
      { name: "상의", slug: "women-tops" },
      { name: "하의", slug: "women-bottoms" },
      { name: "원피스/스커트", slug: "women-dress" },
      { name: "아우터", slug: "women-outer" },
      { name: "신발", slug: "women-shoes" },
      { name: "가방", slug: "women-bags" },
      { name: "액세서리", slug: "women-accessories" },
      { name: "언더웨어", slug: "women-underwear" },
    ],
  },
] as const;

export const MOBILE_NAV_ITEMS = [
  { label: "홈", href: "/", icon: "Home" },
  { label: "카테고리", href: "/category", icon: "Grid" },
  { label: "검색", href: "/search", icon: "Search" },
  { label: "좋아요", href: "/wishlist", icon: "Heart" },
  { label: "마이", href: "/my", icon: "User" },
] as const;

export const ITEMS_PER_PAGE = 20;

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ko-KR").format(price) + "원";
}

export function getDiscountRate(basePrice: number, salePrice: number): number {
  if (!salePrice || salePrice >= basePrice) return 0;
  return Math.round(((basePrice - salePrice) / basePrice) * 100);
}
