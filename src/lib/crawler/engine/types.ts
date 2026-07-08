// 신규 크롤러 엔진의 사이트 설정 타입. sites.config.ts가 이 타입으로 사이트를 기술.
export type Platform = "cafe24" | "godomall" | "shopify" | "custom" | "playwright";
export type Strategy = "json_api" | "static_html" | "playwright" | "blocked";

export interface SiteConfig {
  id: string;
  name: string;
  baseUrl: string;
  brandName: string;
  platform: Platform;
  strategy: Strategy;
  /** 상품 리스트 진입점(카테고리 페이지/JSON API/sitemap 등) */
  listEndpoint?: string;
  pagination?: { type: "page" | "offset" | "cursor"; param: string; size?: number };
  /** custom/static_html 사이트용 — recon으로 검증한 실제 셀렉터만 */
  selectors?: Record<string, string>;
  /** 준수할 robots 차단 경로 (참고용 메모) */
  robotsBlocked?: string[];
}

const REQUIRED = ["id", "name", "baseUrl", "brandName", "platform", "strategy"] as const;

export function validateSiteConfig(c: SiteConfig): SiteConfig {
  for (const k of REQUIRED) {
    if (!c[k]) throw new Error(`SiteConfig.${k} 필수 (${c.id ?? "?"})`);
  }
  return c;
}
