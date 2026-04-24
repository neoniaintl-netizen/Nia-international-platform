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
    const $ = this.load(html);

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

    const imageUrls = this.collectImages($, {
      gallerySelectors: [
        ".prd-img img",
        ".view_image img",
        "img[src*='ProductImages']",
      ],
      detailContainers: [
        ".prd-detail",
        ".view_detail",
        "#tab-detail",
        ".detail-wrap",
        "#prd_detail",
        ".productInfo",
        ".product-detail-area",
        "#detailArea",
        ".tab-content",
      ],
      baseUrl: "https://www.pxg.co.kr",
    })
      .map((u) => u.replace(/^http:\/\//, "https://"))
      .filter(
        (u) =>
          !/\/banner\//i.test(u) &&
          !/\/colorchip\//i.test(u) &&
          !/pxg_top|pxg_bottom|tab_/i.test(u)
      );

    const description = this.extractDescriptionHtml($, [
      ".prd-detail",
      ".view_detail",
      "#tab-detail",
      ".detail-wrap",
      "#prd_detail",
      ".productInfo",
      "#detailArea",
      ".tab-content",
      ".product-detail-area",
    ]);

    return {
      name: name.replace(/\s*[\|–\-—]\s*.*$/, "").trim(),
      brandName: "PXG",
      originalPrice: price,
      salePrice: sale,
      imageUrls,
      description,
      sourceUrl: url,
      sourceSite: this.sourceSite,
    };
  }
}
