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

// 이미지 크기 디렉토리(/product/small/... 등)는 상품이 아니라 제외.
const NON_PRODUCT = /\/product\/(small|medium|big|tiny|list)\b/;

/** sitemap.xml(절대 URL) + 카테고리 페이지(상대 링크) 양쪽에서 /product/{slug}/{id}/ 상세 URL 추출. */
export function extractProductUrls(content: string, baseUrl: string): string[] {
  const { origin, host } = new URL(baseUrl);
  const urls = new Set<string>();
  // 절대 URL (sitemap)
  const absRe = new RegExp(`https?://${host.replace(/\./g, "\\.")}/product/[^"'<>\\s]+`, "g");
  for (const u of content.match(absRe) ?? []) urls.add(u.split(/[?#]/)[0]);
  // 상대 URL (카테고리 페이지): /product/{slug}/{numericId}/
  const relRe = /\/product\/[A-Za-z0-9가-힣%_-]+\/\d+\//g;
  for (const rel of content.match(relRe) ?? []) urls.add(origin + rel);
  return [...urls].filter(
    (u) => !NON_PRODUCT.test(u) && /\/\d+\/?$/.test(u.replace(/[?#].*$/, "")),
  );
}

export class Cafe24Adapter implements Adapter {
  readonly platform = "cafe24";
  async collect(cfg: SiteConfig, opts: { limit: number }): Promise<CrawledProduct[]> {
    const base = cfg.baseUrl.replace(/\/$/, "");
    // listEndpoint는 sitemap.xml 또는 카테고리 리스트 페이지 둘 다 가능.
    const listing = await fetchHtml(cfg.listEndpoint || `${base}/sitemap.xml`);
    const urls = extractProductUrls(listing, cfg.baseUrl).slice(0, opts.limit);
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
