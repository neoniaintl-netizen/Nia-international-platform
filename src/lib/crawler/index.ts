import { MusinsaCrawler } from "./musinsa-crawler";
import { Cm29Crawler } from "./cm29-crawler";
import { Cafe24Crawler } from "./cafe24-crawler";
import { WConceptCrawler } from "./wconcept-crawler";
import { ShopifyCrawler } from "./shopify-crawler";
import { GenericCrawler } from "./generic-crawler";
import type { ICrawler } from "./types";

export type {
  CrawlConfig,
  CrawlResult,
  CrawledProduct,
  CrawledVariant,
  ICrawler,
} from "./types";

/**
 * 지원 사이트 목록
 */
export const SUPPORTED_SITES = [
  { id: "musinsa", name: "무신사", url: "https://www.musinsa.com", category: "platform" },
  { id: "29cm", name: "29CM", url: "https://shop.29cm.co.kr", category: "platform" },
  { id: "wconcept", name: "W Concept", url: "https://www.wconcept.co.kr", category: "platform" },
  { id: "shopify", name: "Shopify 기반 브랜드몰", url: "", category: "brand", description: "Salomon, Wilson, Alo Yoga 등" },
  { id: "cafe24", name: "Cafe24 자사몰", url: "", category: "brand", description: "Cafe24 기반 브랜드몰 (국내 자사몰 70%+)" },
  { id: "generic", name: "기타 (자동감지)", url: "", category: "generic", description: "OpenGraph / JSON-LD 기반 범용 크롤러" },
] as const;

/** 사이트별 크롤러 인스턴스 생성 */
export function getCrawler(sourceSite: string): ICrawler {
  switch (sourceSite) {
    case "musinsa":
      return new MusinsaCrawler();
    case "29cm":
      return new Cm29Crawler();
    case "wconcept":
      return new WConceptCrawler();
    case "shopify":
      return new ShopifyCrawler();
    case "cafe24":
      return new Cafe24Crawler();
    case "generic":
      return new GenericCrawler();
    default:
      return new GenericCrawler();
  }
}

/**
 * URL에서 사이트 자동 감지
 */
export function detectSite(url: string): string {
  const hostname = new URL(url).hostname.toLowerCase();

  if (hostname.includes("musinsa.com")) return "musinsa";
  if (hostname.includes("29cm.co.kr")) return "29cm";
  if (hostname.includes("wconcept.co.kr")) return "wconcept";

  // Shopify 기반 브랜드몰
  if (
    hostname.includes("salomon.co.kr") ||
    hostname.includes("wilson.com") ||
    hostname.includes("aloyoga.com")
  ) {
    return "shopify";
  }

  return "generic";
}
