// Generic 어댑터 — JSON-LD Product 우선 + og/meta 폴백. 자체몰 중 JSON-LD 노출 사이트 커버.
// listEndpoint(sitemap 또는 카테고리/홈)에서 selectors.productUrlPattern 정규식으로 상세 URL 수집.
import * as cheerio from "cheerio";
import type { CrawledProduct } from "../types";
import type { SiteConfig } from "../engine/types";
import { type Adapter, fetchHtml, randomDelay } from "../engine/base-crawler";
import { findLdProduct, ldPrice, ldImages } from "../engine/jsonld";

function abs(src: string): string {
  return src.startsWith("//") ? `https:${src}` : src;
}

/** JSON-LD Product 우선, 없으면 og:title + meta price. (순수 함수 — fixture 테스트 대상) */
export function parseGenericDetail(html: string, url: string, cfg: SiteConfig): CrawledProduct | null {
  const $ = cheerio.load(html);
  const ld = findLdProduct($);

  const name = String(ld?.name || $('meta[property="og:title"]').attr("content") || $("title").text() || "")
    .replace(/\s*[|\-–].*$/, "")
    .trim();
  if (!name) return null;

  let price = ldPrice(ld);
  if (!price) {
    const mp = $('meta[property="product:price:amount"]').attr("content");
    price = mp ? Math.round(parseFloat(mp)) : 0;
  }
  if (price <= 0) return null;

  const images: string[] = [...ldImages(ld)];
  const og = $('meta[property="og:image"]').attr("content");
  if (og) images.push(abs(og));

  return {
    name,
    brandName: cfg.brandName,
    originalPrice: price,
    imageUrls: [...new Set(images)].filter((u) => /^https?:\/\//.test(u)),
    sourceUrl: url,
    sourceSite: cfg.id,
    externalProductId: url.match(/(\d{2,})/)?.[1],
  };
}

/** listEndpoint에서 selectors.productUrlPattern(정규식 문자열)으로 상세 URL 추출. */
export function extractGenericUrls(listing: string, cfg: SiteConfig): string[] {
  const origin = new URL(cfg.baseUrl).origin;
  const pat = cfg.selectors?.productUrlPattern;
  if (!pat) return [];
  const re = new RegExp(pat, "g");
  const found = listing.match(re) ?? [];
  return [...new Set(found.map((u) => (u.startsWith("http") ? u : origin + u)))];
}

export class GenericAdapter implements Adapter {
  readonly platform = "custom";
  async collect(cfg: SiteConfig, opts: { limit: number }): Promise<CrawledProduct[]> {
    if (!cfg.listEndpoint) throw new Error(`generic(${cfg.id}) listEndpoint 필요`);
    const listing = await fetchHtml(cfg.listEndpoint);
    const urls = extractGenericUrls(listing, cfg).slice(0, opts.limit);
    const out: CrawledProduct[] = [];
    for (const url of urls) {
      try {
        const html = await fetchHtml(url);
        const p = parseGenericDetail(html, url, cfg);
        if (p && p.originalPrice > 0) out.push(p);
      } catch {
        /* 개별 상품 실패는 건너뜀 */
      }
      await randomDelay();
    }
    return out;
  }
}
