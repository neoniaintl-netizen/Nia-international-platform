// 사이트 설정 — Phase 1 정찰(site_analysis.md) 결과 반영.
// 파일럿 3개(Phase 2)만 strategy 확정. 나머지는 Phase 3에서 상세 검증 후 추가.
import { validateSiteConfig, type SiteConfig } from "./engine/types";

const RAW_SITES: SiteConfig[] = [
  // ── 파일럿 3개 (Phase 2) ──
  {
    id: "markandlona",
    name: "마크앤로나",
    baseUrl: "https://markandlona-korea.co.kr",
    brandName: "MARK & LONA",
    platform: "shopify",
    strategy: "json_api",
  },
  {
    id: "anewgolf",
    name: "어뉴골프",
    baseUrl: "https://anewgolf.com",
    brandName: "어뉴골프",
    platform: "cafe24",
    strategy: "static_html",
    listEndpoint: "https://anewgolf.com/sitemap.xml",
  },
  {
    id: "southcape",
    name: "사우스케이프",
    baseUrl: "https://southcape.shop",
    brandName: "사우스케이프",
    platform: "godomall",
    strategy: "static_html",
    listEndpoint: "https://southcape.shop/goods/goods_list.php?cateCd=002",
  },
];

export const SITES: SiteConfig[] = RAW_SITES.map(validateSiteConfig);

export function getSite(id: string): SiteConfig | undefined {
  return SITES.find((s) => s.id === id);
}
