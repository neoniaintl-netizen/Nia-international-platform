/**
 * 홈 v2 설정값 — 운영자가 코드에서 교체하는 값들.
 * (배너 이미지 파일은 public/ 아래에 두고 절대경로로 참조)
 */

/** §6 브랜드 스포트라이트 — 피처 브랜드. slug 만 바꾸면 배너·레일이 통째로 교체됨 */
export const SPOTLIGHT_BRAND_SLUG = "anewgolf";

/**
 * §6 스포트라이트 대형 배너.
 * imageUrl 이 null 이면 이미지 없이 대형 타이포 배너로 렌더 (이미지 자산 확보 전 fallback).
 */
export const SPOTLIGHT_BANNER: {
  imageUrl: string | null;
  title: string;
  subtitle: string;
} = {
  imageUrl: null,
  title: "ANEW GOLF",
  subtitle: "이번 주 스포트라이트 — 코스 안팎을 채우는 시그니처 룩",
};

/** §5 브랜드 라인업 카드 카피 — slug 별 지정, 없으면 기본 문구 사용 */
export const BRAND_LINEUP_COPY: Record<
  string,
  { title: string; subtitle?: string }
> = {
  anewgolf: { title: "코스 위의 위트", subtitle: "어뉴 골프 신상 컬렉션" },
  aloyoga: { title: "스튜디오에서 일상까지", subtitle: "알로 요가 베스트" },
  kolonsport: { title: "자연을 향한 감각", subtitle: "코오롱스포츠" },
  salomon: { title: "트레일의 기준", subtitle: "살로몬 퍼포먼스" },
  thenorthface: { title: "탐험의 아이콘", subtitle: "노스페이스" },
  "markandlona-korea": { title: "펑크와 럭셔리 사이", subtitle: "마크앤로나" },
  arcteryx: { title: "정교함의 정점", subtitle: "아크테릭스" },
  wilson: { title: "클래식 스포츠 헤리티지", subtitle: "윌슨" },
};

export const BRAND_LINEUP_DEFAULT_COPY = { title: "지금 주목할 브랜드" };
