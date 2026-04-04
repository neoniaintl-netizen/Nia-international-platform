export const SITE_NAME = "MUSINSA";
export const SITE_DESCRIPTION = "온라인 패션 스토어";

export const CHANNELS = [
  { name: "MUSINSA", slug: "musinsa", displayName: "무신사", color: "#000000" },
  { name: "BEAUTY", slug: "beauty", displayName: "뷰티", color: "#FF6B9D" },
  { name: "KICKS", slug: "kicks", displayName: "킥스", color: "#FF4500" },
  { name: "SPORTS", slug: "sports", displayName: "스포츠", color: "#0066FF" },
  { name: "OUTLET", slug: "outlet", displayName: "아울렛", color: "#00B894" },
  { name: "BOUTIQUE", slug: "boutique", displayName: "부티크", color: "#6C5CE7" },
  { name: "KIDS", slug: "kids", displayName: "키즈", color: "#FDCB6E" },
  { name: "USED", slug: "used", displayName: "유즈드", color: "#00CEC9" },
] as const;

export const NAV_TABS = [
  { label: "추천", href: "/" },
  { label: "랭킹", href: "/ranking" },
  { label: "세일", href: "/products?sort=sale" },
  { label: "발매", href: "/release" },
  { label: "매거진", href: "/magazine" },
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
