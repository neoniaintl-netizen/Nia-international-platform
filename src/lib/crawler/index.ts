import { MusinsaCrawler } from "./musinsa-crawler";
import { Cm29Crawler } from "./cm29-crawler";
import type { ICrawler } from "./types";

export type { CrawlConfig, CrawlResult, CrawledProduct, CrawledVariant, ICrawler } from "./types";

/** 지원 사이트 목록 */
export const SUPPORTED_SITES = [
  { id: "musinsa", name: "무신사", url: "https://www.musinsa.com" },
  { id: "29cm", name: "29CM", url: "https://shop.29cm.co.kr" },
] as const;

/** 사이트별 크롤러 인스턴스 생성 */
export function getCrawler(sourceSite: string): ICrawler {
  switch (sourceSite) {
    case "musinsa":
      return new MusinsaCrawler();
    case "29cm":
      return new Cm29Crawler();
    default:
      throw new Error(`지원하지 않는 사이트: ${sourceSite}`);
  }
}
