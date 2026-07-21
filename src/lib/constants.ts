export const SITE_NAME = "NOVAREN";
export const SITE_DESCRIPTION = "중국 수출 구매대행 & 패션 플랫폼";

export const CHANNELS = [
  { name: "GOLF", slug: "golf", displayName: "골프", color: "#2D7D46" },
  { name: "SPORTS", slug: "sports", displayName: "스포츠", color: "#0066FF" },
  { name: "OUTDOOR", slug: "outdoor", displayName: "아웃도어", color: "#FF8C00" },
  { name: "BEAUTY", slug: "beauty", displayName: "뷰티", color: "#FF6B9D" },
  { name: "WOMEN", slug: "women", displayName: "여성의류", color: "#9B59B6" },
] as const;

export const NAV_TABS = [
  { key: "recommend", label: "추천", href: "/" },
  { key: "ranking", label: "랭킹", href: "/ranking" },
  { key: "sale", label: "세일", href: "/products?sort=sale" },
  { key: "event", label: "기획전", href: "/events" },
  { key: "outfit", label: "코디", href: "/outfits" },
  { key: "lookbook", label: "룩북", href: "/lookbook" },
  { key: "release", label: "발매", href: "/release" },
  { key: "magazine", label: "매거진", href: "/magazine" },
  { key: "outlet", label: "아울렛", href: "/outlet" },
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
