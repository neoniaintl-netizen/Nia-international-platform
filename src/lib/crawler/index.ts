import { MusinsaCrawler } from "./musinsa-crawler";
import { Cm29Crawler } from "./cm29-crawler";
import { Cafe24Crawler } from "./cafe24-crawler";
import { WConceptCrawler } from "./wconcept-crawler";
import { ShopifyCrawler } from "./shopify-crawler";
import { NorthFaceCrawler } from "./northface-crawler";
import { GodomallCrawler } from "./godomall-crawler";
import { GForeCrawler } from "./gfore-crawler";
import { TheCartCrawler } from "./thecart-crawler";
import { DkOnCrawler } from "./dkon-crawler";
import { PxgCrawler } from "./pxg-crawler";
import { ArcteryxCrawler } from "./arcteryx-crawler";
import { GenericCrawler } from "./generic-crawler";
import type { ICrawler } from "./types";

export type {
  CrawlConfig,
  CrawlResult,
  CrawledProduct,
  CrawledVariant,
  ICrawler,
} from "./types";

// SUPPORTED_SITES / detectSite — client-safe 분리 (./sites.ts).
// crawler 클래스 의존성 없이 re-export 만 함 (backward compat 유지).
export { SUPPORTED_SITES, detectSite } from "./sites";

export function getCrawler(sourceSite: string): ICrawler {
  switch (sourceSite) {
    case "musinsa": return new MusinsaCrawler();
    case "29cm": return new Cm29Crawler();
    case "wconcept": return new WConceptCrawler();
    case "shopify": return new ShopifyCrawler();
    case "northface": return new NorthFaceCrawler();
    case "godomall": return new GodomallCrawler();
    case "gfore": return new GForeCrawler();
    case "thecart": return new TheCartCrawler();
    case "dkon": return new DkOnCrawler();
    case "pxg": return new PxgCrawler();
    case "arcteryx": return new ArcteryxCrawler();
    case "cafe24": return new Cafe24Crawler();
    case "generic": return new GenericCrawler();
    default: return new GenericCrawler();
  }
}

