/**
 * 홈 v2 설정값 — 운영자가 코드에서 교체하는 값들.
 * (배너 이미지 파일은 public/ 아래에 두고 절대경로로 참조)
 */

/** §6 브랜드 스포트라이트 — 피처 브랜드. slug 만 바꾸면 배너·레일이 통째로 교체됨 */
export const SPOTLIGHT_BRAND_SLUG = "anewgolf";

/**
 * §6 스포트라이트 대형 배너.
 * imageUrl 이 null 이면 이미지 없이 대형 타이포 배너로 렌더 (이미지 자산 확보 전 fallback).
 * title 은 브랜드명(영문 유지 — DB 콘텐츠 비번역 원칙), 서브카피는 Home.spotlightSubtitle 번역 사용.
 */
export const SPOTLIGHT_BANNER: {
  imageUrl: string | null;
  title: string;
} = {
  imageUrl: null,
  title: "ANEW GOLF",
};

type LineupCopy = { title: string; subtitle?: string };

/**
 * §5 브랜드 라인업 카드 에디토리얼 카피 — 로케일별 · slug 별.
 * 없으면 카드가 브랜드명 기반 기본 표기로 fallback.
 */
export const BRAND_LINEUP_COPY: Record<
  string,
  Record<string, LineupCopy>
> = {
  ko: {
    anewgolf: { title: "코스 위의 위트", subtitle: "어뉴 골프 신상 컬렉션" },
    aloyoga: { title: "스튜디오에서 일상까지", subtitle: "알로 요가 베스트" },
    kolonsport: { title: "자연을 향한 감각", subtitle: "코오롱스포츠" },
    salomon: { title: "트레일의 기준", subtitle: "살로몬 퍼포먼스" },
    thenorthface: { title: "탐험의 아이콘", subtitle: "노스페이스" },
    "markandlona-korea": { title: "펑크와 럭셔리 사이", subtitle: "마크앤로나" },
    arcteryx: { title: "정교함의 정점", subtitle: "아크테릭스" },
    wilson: { title: "클래식 스포츠 헤리티지", subtitle: "윌슨" },
  },
  en: {
    anewgolf: { title: "Wit on the Course", subtitle: "ANEW Golf new collection" },
    aloyoga: { title: "Studio to Street", subtitle: "Alo Yoga best picks" },
    kolonsport: { title: "A Sense of Nature", subtitle: "Kolon Sport" },
    salomon: { title: "The Trail Standard", subtitle: "Salomon performance" },
    thenorthface: { title: "Icon of Exploration", subtitle: "The North Face" },
    "markandlona-korea": { title: "Between Punk & Luxury", subtitle: "MARK & LONA" },
    arcteryx: { title: "Precision, Perfected", subtitle: "Arc'teryx" },
    wilson: { title: "Classic Sports Heritage", subtitle: "Wilson" },
  },
  zh: {
    anewgolf: { title: "球场上的俏皮态度", subtitle: "ANEW 高尔夫新品系列" },
    aloyoga: { title: "从瑜伽室到日常", subtitle: "Alo Yoga 精选" },
    kolonsport: { title: "亲近自然的感性", subtitle: "Kolon Sport" },
    salomon: { title: "越野的标准", subtitle: "Salomon 性能系列" },
    thenorthface: { title: "探险的象征", subtitle: "The North Face" },
    "markandlona-korea": { title: "朋克与奢华之间", subtitle: "MARK & LONA" },
    arcteryx: { title: "精工之巅", subtitle: "Arc'teryx" },
    wilson: { title: "经典运动传承", subtitle: "Wilson" },
  },
};
