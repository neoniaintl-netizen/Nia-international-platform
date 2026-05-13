/**
 * Client-safe: 사이트 메타데이터 + URL → sourceSite slug 감지.
 * 어떤 crawler 클래스도 import 하지 않음 → playwright/cheerio 등 server-only 의존성 0.
 *
 * crawler 인스턴스가 필요한 server-side 는 `@/lib/crawler` (index.ts) 의 `getCrawler` 를 사용.
 */

export const SUPPORTED_SITES = [
  { id: "musinsa", name: "무신사", url: "https://www.musinsa.com", category: "platform" },
  { id: "29cm", name: "29CM", url: "https://shop.29cm.co.kr", category: "platform" },
  { id: "wconcept", name: "W Concept", url: "https://www.wconcept.co.kr", category: "platform" },
  { id: "shopify", name: "Shopify 기반 브랜드몰", url: "", category: "brand" },
  { id: "northface", name: "The North Face Korea", url: "https://www.thenorthfacekorea.co.kr", category: "brand" },
  { id: "godomall", name: "Godomall5 (사우스케이프 등)", url: "", category: "brand" },
  { id: "gfore", name: "G/FORE Korea", url: "https://www.gfore.kr", category: "brand" },
  { id: "thecart", name: "THE CART", url: "https://www.thecart.co.kr", category: "brand" },
  { id: "dkon", name: "dk-on (Descente)", url: "https://dk-on.com", category: "brand" },
  { id: "pxg", name: "PXG", url: "https://www.pxg.co.kr", category: "brand" },
  { id: "cafe24", name: "Cafe24 자사몰", url: "", category: "brand" },
  { id: "generic", name: "기타 (자동감지)", url: "", category: "generic" },
] as const;

export function detectSite(url: string): string {
  const hostname = new URL(url).hostname.toLowerCase();

  if (hostname.includes("musinsa.com")) return "musinsa";
  if (hostname.includes("29cm.co.kr")) return "29cm";
  if (hostname.includes("wconcept.co.kr")) return "wconcept";

  if (
    hostname.includes("salomon.co.kr") ||
    hostname.includes("wilson.com") ||
    hostname.includes("aloyoga.com") ||
    hostname.includes("markandlona-korea.co.kr")
  ) {
    return "shopify";
  }

  if (hostname.includes("thenorthfacekorea.co.kr")) return "northface";
  if (hostname.includes("southcape.shop")) return "godomall";
  if (hostname.includes("gfore.kr")) return "gfore";
  if (hostname.includes("thecart.co.kr")) return "thecart";
  if (hostname.includes("dk-on.com")) return "dkon";
  if (hostname.includes("pxg.co.kr")) return "pxg";

  if (
    hostname.includes("anewgolf.com") ||
    hostname.includes("iceberggolf.com") ||
    hostname.includes("utaagolf.com") ||
    hostname.includes("peltgolf.com")
  ) {
    return "cafe24";
  }

  return "generic";
}
