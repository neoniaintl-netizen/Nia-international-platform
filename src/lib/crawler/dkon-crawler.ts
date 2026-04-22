import * as cheerio from "cheerio";
import { BaseCrawler } from "./base-crawler";
import type { CrawledProduct } from "./types";

/**
 * dk-on.com 크롤러 — 데상트 그룹 통합 플랫폼
 *
 * 리스팅: /{BRAND}/category/{id}  ex: /DESCENTEGOLF/category/201000000
 * 상세:   /{BRAND}/product/{MODEL}/{COLOR}
 */
export class DkOnCrawler extends BaseCrawler {
  readonly sourceSite = "dkon";

  parseProductList(html: string): string[] {
    const urls = new Set<string>();
    const rx = /\/([A-Z]+(?:GOLF|LX|KIDS)?)\/product\/([A-Z0-9]+)\/([A-Z0-9]+)/g;
    const matches = Array.from(html.matchAll(rx));
    for (const m of matches) {
      urls.add(`https://dk-on.com/${m[1]}/product/${m[2]}/${m[3]}`);
    }
    return Array.from(urls);
  }

  parseProductDetail(html: string, url: string): CrawledProduct | null {
    const $ = cheerio.load(html);

    const name =
      $('meta[property="og:title"]').attr("content") ||
      $("h1").first().text().trim() ||
      $('[class*="product-name"], [class*="goods-name"]').first().text().trim();
    if (!name) return null;

    let price = 0;
    let sale: number | undefined;

    const mp = $('meta[property="product:price:amount"]').attr("content");
    if (mp) price = parseInt(mp.replace(/[^0-9]/g, ""), 10);

    // 가격 HTML 추출
    const priceTexts = [
      $(".price-retail, .retail-price, .consumer-price").first().text(),
      $(".price-sale, .sale-price, .price").first().text(),
    ];
    const retail = parseInt(priceTexts[0].replace(/[^0-9]/g, ""), 10);
    const saleP = parseInt(priceTexts[1].replace(/[^0-9]/g, ""), 10);

    if (retail > 0 && saleP > 0 && saleP < retail) {
      price = retail;
      sale = saleP;
    } else if (price === 0 && saleP > 0) {
      price = saleP;
    } else if (price === 0 && retail > 0) {
      price = retail;
    }

    if (price === 0) return null;

    const imgs = new Set<string>();
    const og = $('meta[property="og:image"]').attr("content");
    if (og) imgs.add(og);
    $("img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (!src) return;
      if (src.includes("dk-on") || src.includes("descente")) {
        imgs.add(src.startsWith("//") ? `https:${src}` : src);
      }
    });

    // 브랜드 추론 (URL 경로에서)
    let brand = "Descente Golf";
    const pathMatch = url.match(/\/([A-Z]+(?:GOLF|LX|KIDS)?)\//);
    if (pathMatch?.[1] === "DESCENTEGOLF") brand = "Descente Golf";
    else if (pathMatch?.[1] === "DESCENTE") brand = "Descente";

    return {
      name: name.replace(/\s*[\|–\-—]\s*.*$/, "").trim(),
      brandName: brand,
      originalPrice: price,
      salePrice: sale,
      imageUrls: Array.from(imgs).slice(0, 6),
      description:
        $('meta[property="og:description"]').attr("content")?.slice(0, 500),
      sourceUrl: url,
      sourceSite: this.sourceSite,
    };
  }
}
