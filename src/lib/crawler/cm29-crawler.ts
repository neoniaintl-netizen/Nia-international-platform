import * as cheerio from "cheerio";
import { BaseCrawler } from "./base-crawler";
import type { CrawledProduct } from "./types";

/**
 * 29cm 크롤러
 * - 베스트/신상품 목록에서 상품 URL 추출
 * - 상품 상세 페이지에서 정보 파싱
 *
 * NOTE: 실제 29cm 사이트 구조가 변경되면 셀렉터 업데이트 필요
 */
export class Cm29Crawler extends BaseCrawler {
  readonly sourceSite = "29cm";

  /** 목록 페이지에서 상품 URL 추출 */
  parseProductList(html: string): string[] {
    const $ = cheerio.load(html);
    const urls: string[] = [];

    const selectors = [
      'a[href*="/product/"]',
      'a[href*="/goods/"]',
      '[class*="product"] a[href]',
      '[class*="item"] a[href]',
    ];

    for (const selector of selectors) {
      $(selector).each((_, el) => {
        const href = $(el).attr("href");
        if (href && !urls.includes(href)) {
          const fullUrl = href.startsWith("http")
            ? href
            : `https://shop.29cm.co.kr${href.startsWith("/") ? "" : "/"}${href}`;
          urls.push(fullUrl);
        }
      });
      if (urls.length > 0) break;
    }

    return [...new Set(urls)];
  }

  /** 상품 상세 페이지 파싱 */
  parseProductDetail(html: string, url: string): CrawledProduct | null {
    const $ = cheerio.load(html);

    const name =
      $('meta[property="og:title"]').attr("content") ||
      $("h2.prd_name").text().trim() ||
      $('[class*="product-name"]').first().text().trim() ||
      $("h1").first().text().trim();

    if (!name) return null;

    const brandName =
      $('meta[property="product:brand"]').attr("content") ||
      $(".brand_name a").text().trim() ||
      $('[class*="brand"]').first().text().trim() ||
      "Unknown";

    const priceText =
      $('meta[property="product:price:amount"]').attr("content") ||
      $('[class*="price"]').first().text();
    const originalPrice = this.parsePrice(priceText);

    const salePriceText =
      $('meta[property="product:sale_price:amount"]').attr("content") ||
      $('[class*="sale"]').first().text();
    const salePrice = this.parsePrice(salePriceText);

    const imageUrls: string[] = [];
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) imageUrls.push(ogImage);

    $('[class*="product-image"] img, .prd_gallery img').each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src && !imageUrls.includes(src)) {
        imageUrls.push(src.startsWith("//") ? `https:${src}` : src);
      }
    });

    const description =
      $('meta[property="og:description"]').attr("content") || "";

    const categoryName =
      $('meta[property="product:category"]').attr("content") || "";

    const variants: CrawledProduct["variants"] = [];
    $("select option, [data-size]").each((_, el) => {
      const size = $(el).text().trim() || $(el).attr("data-size");
      if (
        size &&
        !["선택", "사이즈", "옵션"].some((k) => size.includes(k))
      ) {
        variants.push({ size, stock: 100 });
      }
    });

    return {
      name,
      brandName,
      categoryName: categoryName || undefined,
      originalPrice: originalPrice || 0,
      salePrice: salePrice && salePrice < originalPrice ? salePrice : undefined,
      description: description || undefined,
      imageUrls,
      sourceUrl: url,
      sourceSite: this.sourceSite,
      variants: variants.length > 0 ? variants : undefined,
    };
  }

  private parsePrice(text: string | undefined): number {
    if (!text) return 0;
    const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
    return isNaN(num) ? 0 : num;
  }
}
