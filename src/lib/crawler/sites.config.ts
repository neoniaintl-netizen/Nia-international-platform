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

  // ── Phase 3: Cafe24 공통 어댑터 재사용 (설정만 추가) ──
  {
    id: "utaa",
    name: "유타",
    baseUrl: "https://utaagolf.com",
    brandName: "유타",
    platform: "cafe24",
    strategy: "static_html",
    listEndpoint: "https://utaagolf.com/sitemap.xml",
  },
  {
    id: "pelt",
    name: "펠트",
    baseUrl: "https://peltgolf.com",
    brandName: "펠트",
    platform: "cafe24",
    strategy: "static_html",
    listEndpoint: "https://peltgolf.com/sitemap.xml",
  },
  {
    id: "iceberg",
    name: "아이스버그",
    baseUrl: "https://iceberggolf.com",
    brandName: "아이스버그",
    platform: "cafe24",
    strategy: "static_html",
    // sitemap 없음 → 카테고리 리스트 페이지에서 상품 URL 수집
    listEndpoint: "https://iceberggolf.com/product/list.html?cate_no=73",
  },

  // ── Phase 3: 자체몰 (GenericAdapter, JSON-LD Product 노출) ──
  {
    id: "amazingcre",
    name: "어메이징크리",
    baseUrl: "https://shop.amazingcre.com",
    brandName: "어메이징크리",
    platform: "custom",
    strategy: "static_html",
    listEndpoint: "https://shop.amazingcre.com/sitemap.xml",
    selectors: { productUrlPattern: "https?://shop\\.amazingcre\\.com/shop_view/\\d+" },
  },
  {
    id: "descentegolf",
    name: "데상트골프",
    baseUrl: "https://dk-on.com",
    brandName: "데상트골프",
    platform: "custom",
    strategy: "static_html",
    listEndpoint: "https://dk-on.com/DESCENTEGOLF",
    selectors: { productUrlPattern: "/DESCENTEGOLF/product/[A-Za-z0-9]+" },
  },
  {
    id: "pxg",
    name: "PXG",
    baseUrl: "https://www.pxg.co.kr",
    brandName: "PXG",
    platform: "custom",
    strategy: "static_html",
    // JSON-LD 없음 → og:title(이름) + #ProductPriceSale(가격) 커스텀 셀렉터
    listEndpoint: "https://www.pxg.co.kr/main/apparel.asp",
    selectors: {
      productUrlPattern: "/product/view\\.asp\\?pno=\\d+",
      priceSelector: "#ProductPriceSale",
    },
  },
];

export const SITES: SiteConfig[] = RAW_SITES.map(validateSiteConfig);

export function getSite(id: string): SiteConfig | undefined {
  return SITES.find((s) => s.id === id);
}
