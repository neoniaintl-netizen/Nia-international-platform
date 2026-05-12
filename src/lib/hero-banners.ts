/**
 * 홈 히어로 배너 (코드 fallback)
 *
 * - 이미지는 `public/banners/` 아래에 두고 절대경로로 참조
 *   → 파일명만 동일하면 코드 수정 없이 교체 가능
 * - 추가/순서 변경: 배열 항목만 수정. 컴포넌트는 길이에 자동 적응
 */
import type { BannerData } from "@/components/home/hero-banner";

export const HERO_BANNERS: BannerData[] = [
  // 1번: 화이트 셋업 커플 + 해변 (인물 우측, 좌측 빈 하늘/바다)
  {
    id: "selection",
    title: "Discover\nBrands",
    subtitle: "Hand-picked brands, all in one place.",
    imageUrl: "/banners/hero-1.png",
    imageAlignment: "right",
    linkUrl: "/brands",
    cta: "Explore Brands",
    bgColor: "#D9D8D0",
  },
  // 2번: 그린 배경 폴로 (인물 좌측, 우측 빈 그린 그라디언트)
  {
    id: "newest",
    title: "New\nThis Season",
    subtitle: "The latest arrivals, before anyone else.",
    imageUrl: "/banners/hero-2.png",
    imageAlignment: "left",
    linkUrl: "/products?sort=newest",
    cta: "Shop New",
    bgColor: "#94A055",
  },
  // 3번: 핑크 배경 골프 (인물 우측, 좌측 빈 핑크)
  {
    id: "curation",
    title: "Editor's\nEdit",
    subtitle: "Curated picks of the week.",
    imageUrl: "/banners/hero-3.png",
    imageAlignment: "right",
    linkUrl: "/events",
    cta: "View Edits",
    bgColor: "#F5C8D2",
  },
];
