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

  // Cafe24 브랜드몰들
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
