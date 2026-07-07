// Cafe24 어댑터 — static_html. sitemap→상세, JSON-LD Product + 전역변수 + og:image.
// 필드 위치는 anewgolf/detail-1.html fixture로 검증 (JSON-LD price=658000).
import * as cheerio from "cheerio";
import type { CrawledProduct } from "../types";
import type { SiteConfig } from "../engine/types";
import { type Adapter, fetchHtml, randomDelay } from "../engine/base-crawler";

function abs(src: string): string {
  return src.startsWith("//") ? `https:${src}` : src;
}

interface LdProduct {
  name?: string;
  offers?: { price?: string | number } | { price?: string | number }[];
}

/** HTML에서 JSON-LD Product 노드 추출 (@graph 지원). */
function findLdProduct($: cheerio.CheerioAPI): LdProduct | null {
  let found: LdProduct | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const d = JSON.parse($(el).text() || "{}") as Record<string, unknown>;
      const graph = d["@graph"];
      const prod =
        d["@type"] === "Product"
          ? d
          : Array.isArray(graph)
            ? graph.find((x) => (x as Record<string, unknown>)["@type"] === "Product")
            : null;
      if (prod) {
        found = prod as LdProduct;
        return false;
      }
    } catch {
      /* skip malformed ld+json */
    }
  });
  return found;
}

/** Cafe24 상세 HTML → CrawledProduct. (순수 함수 — fixture 테스트 대상) */
export function parseCafe24Detail(html: string, url: string, cfg: SiteConfig): CrawledProduct | null {
  const $ = cheerio.load(html);
  const ld = findLdProduct($);

  const nameFromVar = html.match(/product_name\s*=\s*['"]([^'"]+)['"]/)?.[1];
  const name = String(ld?.name || nameFromVar || $('meta[property="og:title"]').attr("content") || "")
    .replace(/\s*[|\-–].*$/, "")
    .trim();
  if (!name) return null;

  const offers = ld?.offers;
  const offer = Array.isArray(offers) ? offers[0] : offers;
  let price = offer?.price ? Math.round(parseFloat(String(offer.price))) : 0;
  if (!price) {
    const pv = html.match(/product_price\s*=\s*['"]?([0-9,]+)/)?.[1];
    price = pv ? parseInt(pv.replace(/,/g, ""), 10) : 0;
  }

  const images: string[] = [];
  const og = $('meta[property="og:image"]').attr("content");
  if (og) images.push(abs(og));
  $(".keyImg img, .xans-product-image img, .xans-product-addimage img, .prdImgView img").each((_, el) => {
    const s = $(el).attr("src") || $(el).attr("data-src");
    if (s) images.push(abs(s));
  });

  return {
    name,
    brandName: cfg.brandName,
    originalPrice: price,
    imageUrls: [...new Set(images)].filter((u) => /^https?:\/\//.test(u)),
    sourceUrl: url,
    sourceSite: cfg.id,
    externalProductId: url.match(/\/(\d+)\/?$/)?.[1],
  };
}

/** sitemap.xml에서 /product/ 상세 URL 추출. */
export function extractProductUrls(sitemapXml: string, baseUrl: string): string[] {
  const host = new URL(baseUrl).host;
  const re = new RegExp(`https?://${host.replace(/\./g, "\\.")}/product/[^<\\s]+`, "g");
  return [...new Set(sitemapXml.match(re) ?? [])];
}

export class Cafe24Adapter implements Adapter {
  readonly platform = "cafe24";
  async collect(cfg: SiteConfig, opts: { limit: number }): Promise<CrawledProduct[]> {
    const base = cfg.baseUrl.replace(/\/$/, "");
    const sitemapXml = await fetchHtml(cfg.listEndpoint || `${base}/sitemap.xml`);
    const urls = extractProductUrls(sitemapXml, cfg.baseUrl).slice(0, opts.limit);
    const out: CrawledProduct[] = [];
    for (const url of urls) {
      try {
        const html = await fetchHtml(url);
        const p = parseCafe24Detail(html, url, cfg);
        if (p && p.originalPrice > 0) out.push(p);
      } catch {
        /* 개별 상품 실패는 건너뜀 */
      }
      await randomDelay();
    }
    return out;
  }
}
