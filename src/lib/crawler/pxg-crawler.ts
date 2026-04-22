import * as cheerio from "cheerio";
import { BaseCrawler } from "./base-crawler";
import type { CrawledProduct } from "./types";

/**
 * PXG 골프 (pxg.co.kr) 크롤러 — ASP 기반
 *
 * 리스팅: /product/list.asp?cno={N}
 * 상세:   /product/view.asp?pno={N}
 */
export class PxgCrawler extends BaseCrawler {
  readonly sourceSite = "pxg";

  parseProductList(html: string): string[] {
    const urls = new Set<string>();
    const rx = /view\.asp\?pno=(\d+)/g;
    const matches = Array.from(html.matchAll(rx));
    for (const m of matches) {
      urls.add(`https://www.pxg.co.kr/product/view.asp?pno=${m[1]}`);
    }
    return Array.from(urls);
  }

  parseProductDetail(html: string, url: string): CrawledProduct | null {
    const $ = cheerio.load(html);

    const name =
      $('meta[property="og:title"]').attr("content") ||
      $("h1, h2.prd-name, .prd-name, [class*='product-name']").first().text().trim();
    if (!name) return null;

    let price = 0;
    let sale: number | undefined;

    const mp = $('meta[property="product:price:amount"]').attr("content");
    if (mp) price = parseInt(mp.replace(/[^0-9]/g, ""), 10);

    const retail = parseInt(
      $(".price-retail, .org-price, .consumer").first().text().replace(/[^0-9]/g, ""),
      10
    );
    const saleP = parseInt(
      $(".sale-price, .prd-price, .price").first().text().replace(/[^0-9]/g, ""),
      10
    );

    if (retail > 0 && saleP > 0 && saleP < retail) {
      price = retail;
      sale = saleP;
    } else if (price === 0) {
      price = saleP || retail;
    }

    if (price === 0) return null;

    const imgs = new Set<string>();
    const og = $('meta[property="og:image"]').attr("content");
    if (og) imgs.add(og);
    $("img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (!src) return;
      if (src.includes("pxg") || src.includes("/upload/")) {
        imgs.add(src.startsWith("//") ? `https:${src}` : src);
      }
    });

    return {
      name: name.replace(/\s*[\|–\-—]\s*.*$/, "").trim(),
      brandName: "PXG",
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
