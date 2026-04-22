/**
 * 브랜드 → 기본 대분류 카테고리 매핑
 * 크롤링 시 categoryName이 불명확할 때 브랜드 기반 fallback에 사용.
 * 재분류 엔드포인트도 동일 매핑 사용.
 *
 * 사용자 결정: "브랜드 성격 중심" 분류
 */
export const BRAND_SLUG_TO_CATEGORY_SLUG: Record<string, string> = {
  // 아웃도어
  salomon: "outdoor",
  patagonia: "outdoor",
  arcteryx: "outdoor",
  kolonsport: "outdoor",
  thenorthface: "outdoor",

  // 스포츠
  descente: "sports",
  wilson: "sports",

  // 여성의류
  aloyoga: "women",
  "nike-skims": "women",
};

/**
 * 브랜드 이름 → 카테고리 slug 추론 (brand slug를 몰라도 동작하도록)
 */
export function inferCategoryFromBrandName(brandName: string): string | null {
  const n = brandName.toLowerCase();
  if (n.includes("salomon") || n.includes("살로몬")) return "outdoor";
  if (n.includes("patagonia") || n.includes("파타고니아")) return "outdoor";
  if (n.includes("arc'teryx") || n.includes("arcteryx") || n.includes("아크테릭스")) return "outdoor";
  if (n.includes("kolon") || n.includes("코오롱")) return "outdoor";
  if (n.includes("north face") || n.includes("northface") || n.includes("노스페이스")) return "outdoor";
  if (n.includes("descente") || n.includes("데상트")) return "sports";
  if (n.includes("wilson") || n.includes("윌슨")) return "sports";
  if (n.includes("alo") || n.includes("알로")) return "women";
  if (n.includes("nike") && n.includes("skims")) return "women";
  return null;
}
