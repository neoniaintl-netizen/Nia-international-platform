import { MusinsaCrawler } from "./musinsa-crawler";
import { Cm29Crawler } from "./cm29-crawler";
import { Cafe24Crawler } from "./cafe24-crawler";
import { WConceptCrawler } from "./wconcept-crawler";
import { GenericCrawler } from "./generic-crawler";
import type { ICrawler } from "./types";

export type { CrawlConfig, CrawlResult, CrawledProduct, CrawledVariant, ICrawler } from "./types";

/**
 * 지원 사이트 목록
 *
 * 카테고리:
 *   - platform: 대형 패션 플랫폼 (직접 크롤러)
 *   - brand: 브랜드 자사몰 (Cafe24 등 플랫폼 기반)
 *   - generic: 범용 (어떤 사이트든 OpenGraph/JSON-LD 기반으로 시도)
 */
export const SUPPORTED_SITES = [
  // ── 대형 플랫폼 ──
  { id: "musinsa", name: "무신사", url: "https://www.musinsa.com", category: "platform" },
  { id: "29cm", name: "29CM", url: "https://shop.29cm.co.kr", category: "platform" },
  { id: "wconcept", name: "W Concept", url: "https://www.wconcept.co.kr", category: "platform" },

  // ── 브랜드 자사몰 (Cafe24 기반) ──
  { id: "cafe24", name: "Cafe24 자사몰", url: "", category: "brand", description: "Cafe24 기반 브랜드몰 (국내 자사몰 70%+)" },

  // ── 범용 ──
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
    case "cafe24":
      return new Cafe24Crawler();
    case "generic":
      return new GenericCrawler();
    default:
      // 알 수 없는 사이트 → 범용 크롤러 시도
      return new GenericCrawler();
  }
}

/**
 * URL에서 사이트 자동 감지
 * 관리자가 URL만 입력하면 적절한 크롤러를 자동 선택
 */
export function detectSite(url: string): string {
  const hostname = new URL(url).hostname.toLowerCase();

  if (hostname.includes("musinsa.com")) return "musinsa";
  if (hostname.includes("29cm.co.kr")) return "29cm";
  if (hostname.includes("wconcept.co.kr")) return "wconcept";

  // Cafe24 식별 패턴 (자사몰)
  // - cafe24 CDN 사용
  // - 특정 URL 패턴 (/product/detail.html, /product/상품명/숫자/)
  // - 추후 URL 패턴 분석으로 확장 가능

  return "generic";
}
