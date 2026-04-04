import * as cheerio from "cheerio";
import { BaseCrawler } from "./base-crawler";
import type { CrawledProduct } from "./types";

/**
 * 무신사 크롤러
 * - 랭킹/베스트/신상품 목록에서 상품 URL 추출
 * - 상품 상세 페이지에서 정보 파싱
 *
 * NOTE: 실제 무신사 사이트 구조가 변경되면 셀렉터 업데이트 필요
 * MVP에서는 일반적인 커머스 HTML 구조를 기반으로 구현
 */
export class MusinsaCrawler extends BaseCrawler {
  readonly sourceSite = "musinsa";

  /** 목록 페이지에서 상품 URL 추출 */
  parseProductList(html: string): string[] {
    const $ = cheerio.load(html);
    const urls: string[] = [];

    // 무신사 상품 링크 패턴들
    const selectors = [
      'a[href*="/products/"]',
      'a[href*="/app/goods/"]',
      '.list-box a[href]',
      '.product-list a[href]',
      '[class*="product"] a[href]',
      '[data-product-id] a',
    ];

    for (const selector of selectors) {
      $(selector).each((_, el) => {
        const href = $(el).attr("href");
        if (href && !urls.includes(href)) {
          // 절대 URL로 변환
          const fullUrl = href.startsWith("http")
            ? href
            : `https://www.musinsa.com${href.startsWith("/") ? "" : "/"}${href}`;
          urls.push(fullUrl);
        }
      });
      if (urls.length > 0) break; // 첫 번째 매칭 셀렉터 사용
    }

    return [...new Set(urls)]; // 중복 제거
  }

  /** 상품 상세 페이지 파싱 */
  parseProductDetail(html: string, url: string): CrawledProduct | null {
    const $ = cheerio.load(html);

    // 상품명 추출 (여러 셀렉터 시도)
    const name =
      $('meta[property="og:title"]').attr("content") ||
      $(".product_title").text().trim() ||
      $("h2.product-name").text().trim() ||
      $('[class*="product-title"]').first().text().trim() ||
      $("h1").first().text().trim();

    if (!name) return null;

    // 브랜드명
    const brandName =
      $('meta[property="product:brand"]').attr("content") ||
      $(".product_article_contents a").first().text().trim() ||
      $('[class*="brand"]').first().text().trim() ||
      "Unknown";

    // 가격
    const priceText =
      $('meta[property="product:price:amount"]').attr("content") ||
      $(".product_article_price .price").text() ||
      $('[class*="price"]').first().text();
    const originalPrice = this.parsePrice(priceText);

    const salePriceText =
      $('meta[property="product:sale_price:amount"]').attr("content") ||
      $(".product_article_price .txt_price_sale").text() ||
      $('[class*="sale-price"]').first().text();
    const salePrice = this.parsePrice(salePriceText);

    // 이미지
    const imageUrls: string[] = [];
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) imageUrls.push(ogImage);

    $(".product_gallery img, [class*=\"product-image\"] img, .detail_img img").each(
      (_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src");
        if (src && !imageUrls.includes(src)) {
          imageUrls.push(src.startsWith("//") ? `https:${src}` : src);
        }
      }
    );

    // 설명
    const description =
      $('meta[property="og:description"]').attr("content") ||
      $(".product_info_section").text().trim().slice(0, 500) ||
      "";

    // 카테고리
    const categoryName =
      $('meta[property="product:category"]').attr("content") ||
      $(".breadcrumb li").last().text().trim() ||
      "";

    // 사이즈 옵션
    const variants: CrawledProduct["variants"] = [];
    $("select.option_select option, [class*='size'] option, [data-size]").each(
      (_, el) => {
        const size = $(el).text().trim() || $(el).attr("data-size");
        if (size && size !== "사이즈 선택" && size !== "선택하세요") {
          variants.push({ size, stock: 100 }); // 기본 재고
        }
      }
    );

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

  /** 가격 문자열 → 숫자 파싱 */
  private parsePrice(text: string | undefined): number {
    if (!text) return 0;
    const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
    return isNaN(num) ? 0 : num;
  }
}
