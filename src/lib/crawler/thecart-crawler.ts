import * as cheerio from "cheerio";
import { BaseCrawler } from "./base-crawler";
import type { CrawledProduct } from "./types";

/**
 * 더카트 (thecart.co.kr) 크롤러 — Next.js 커스텀
 *
 * 리스팅: /product/all/{gender}/{category}
 * 상세: /product/{slug}
 */
export class TheCartCrawler extends BaseCrawler {
  readonly sourceSite = "thecart";

  parseProductList(html: string): string[] {
    const urls = new Set<string>();
    // /product/ID 패턴 (all/men/outer 같은 리스팅 제외)
    const rx = /\/product\/(?!all)([a-z0-9A-Z][a-z0-9A-Z\-_]{2,})/g;
    const found = Array.from(html.matchAll(rx));
    for (const m of found) {
      urls.add(`https://www.thecart.co.kr/product/${m[1]}`);
    }
    return Array.from(urls);
  }

  parseProductDetail(html: string, url: string): CrawledProduct | null {
    const $ = cheerio.load(html);

    const name =
      $('meta[property="og:title"]').attr("content") ||
      $("h1").first().text().trim();
    if (!name) return null;

    let price = 0;
    const mp = $('meta[property="product:price:amount"]').attr("content");
    if (mp) price = parseInt(mp.replace(/[^0-9]/g, ""), 10);

    // JSON-LD
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || "");
        const product =
          data["@type"] === "Product" ? data : data["@graph"]?.find((i: any) => i["@type"] === "Product");
        if (product?.offers) {
          const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
          const p = parseInt(String(offer?.price || "0"), 10);
          if (p > 0 && price === 0) price = p;
        }
      } catch {}
    });

    if (price === 0) {
      const pt = $('[class*="price"]').first().text() || "";
      const n = parseInt(pt.replace(/[^0-9]/g, ""), 10);
      if (n > 1000) price = n;
    }

    if (price === 0) return null;

    // 이미지
    const imgs = new Set<string>();
    const og = $('meta[property="og:image"]').attr("content");
    if (og) imgs.add(og);
    $('img').each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (!src) return;
      if (src.includes("thecart") || src.includes("/product/")) {
        imgs.add(src.startsWith("//") ? `https:${src}` : src);
      }
    });

    return {
      name: name.replace(/\s*[\|–\-—]\s*.*$/, "").trim(),
      brandName: "THE CART",
      originalPrice: price,
      imageUrls: Array.from(imgs).slice(0, 6),
      description:
        $('meta[property="og:description"]').attr("content")?.slice(0, 500),
      sourceUrl: url,
      sourceSite: this.sourceSite,
    };
  }
}
