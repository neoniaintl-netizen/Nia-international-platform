import * as cheerio from "cheerio";
import { BaseCrawler } from "./base-crawler";
import type { CrawledProduct } from "./types";

/**
 * G/FORE Korea 크롤러 (Kolon F&C 커스텀 Next.js)
 *
 * 리스팅: /Category/List/{id}?inStock=true
 * 상세: /Product/Detail/{id}  또는  href에 상품 경로 포함
 */
export class GForeCrawler extends BaseCrawler {
  readonly sourceSite = "gfore";

  parseProductList(html: string): string[] {
    const urls = new Set<string>();
    // /Product/Detail/... 링크
    const rx = /\/Product\/Detail\/[A-Za-z0-9_\-\/]+/g;
    const found = html.match(rx);
    if (found) {
      for (const p of found) {
        urls.add(`https://www.gfore.kr${p.split("?")[0]}`);
      }
    }
    // 백업: JSON 내 "productId"
    const idMatches = Array.from(html.matchAll(/"productId"\s*:\s*"([^"]+)"/g));
    for (const m of idMatches) {
      urls.add(`https://www.gfore.kr/Product/Detail/${m[1]}`);
    }
    return Array.from(urls);
  }

  parseProductDetail(html: string, url: string): CrawledProduct | null {
    const $ = cheerio.load(html);

    const name =
      $('meta[property="og:title"]').attr("content") ||
      $("h1").first().text().trim();
    if (!name) return null;

    const desc =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";

    // 가격 — meta 또는 JSON-LD
    let price = 0;
    let sale: number | undefined;

    const metaPrice = $('meta[property="product:price:amount"]').attr("content");
    if (metaPrice) price = parseInt(metaPrice.replace(/[^0-9]/g, ""), 10);

    // JSON-LD
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || "");
        const product =
          data["@type"] === "Product"
            ? data
            : data["@graph"]?.find((i: any) => i["@type"] === "Product");
        if (product?.offers) {
          const offer = Array.isArray(product.offers)
            ? product.offers[0]
            : product.offers;
          const p = parseInt(String(offer?.price || "0"), 10);
          if (p > 0) price = p;
        }
      } catch {}
    });

    // HTML fallback
    if (price === 0) {
      const priceText = $('[class*="price"]').first().text() || "";
      const n = parseInt(priceText.replace(/[^0-9]/g, ""), 10);
      if (n > 0) price = n;
    }

    if (price === 0) return null;

    const imageUrls = this.collectImages($, {
      gallerySelectors: [
        "picture img",
        "[data-testid*='product'] img",
        "img[src*='kolonmall']",
        "img[src*='gfore']",
        "img[src*='/product/']",
      ],
      detailContainers: ["[class*='Description']", "[class*='description']", "[class*='detail']"],
      baseUrl: "https://www.gfore.kr",
    });

    if (imageUrls.length === 0) return null;

    const description =
      this.extractDescriptionHtml($, [
        "[class*='Description']",
        "[class*='description']",
        "[class*='ProductDetail']",
        "[class*='detail-content']",
      ]) || desc;

    return {
      name: name.replace(/\s*[\|–\-—]\s*.*$/, "").trim(),
      brandName: "G/FORE",
      originalPrice: price,
      salePrice: sale,
      imageUrls,
      description,
      sourceUrl: url,
      sourceSite: this.sourceSite,
    };
  }
}
