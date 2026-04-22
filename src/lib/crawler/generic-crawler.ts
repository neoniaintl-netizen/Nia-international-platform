import * as cheerio from "cheerio";
import { BaseCrawler } from "./base-crawler";
import type { CrawledProduct } from "./types";

/**
 * 범용 크롤러 – OpenGraph / JSON-LD / meta 태그 기반
 *
 * 대부분의 쇼핑몰에서 사용 가능한 범용 파서.
 * 특화 크롤러가 없는 브랜드 사이트 자동 대응.
 *
 * 데이터 추출 우선순위:
 *   1) JSON-LD (application/ld+json → @type: Product)
 *   2) OpenGraph meta tags (og:title, og:image, product:price:*)
 *   3) HTML 구조 파싱 (일반적인 상품 페이지 패턴)
 */
export class GenericCrawler extends BaseCrawler {
  readonly sourceSite = "generic";

  // ─── 목록 페이지 파싱 ───

  parseProductList(html: string): string[] {
    const $ = cheerio.load(html);
    const urls: string[] = [];

    // 1) 일반적인 상품 링크 패턴
    const productPatterns = [
      'a[href*="/products/"]',
      'a[href*="/product/"]',
      'a[href*="/item/"]',
      'a[href*="/goods/"]',
      'a[href*="/detail/"]',
      'a[href*="product_no="]',
      'a[href*="goods_no="]',
      ".product-item a",
      ".product-card a",
      "[data-product-id] a",
      ".goods-list a",
    ];

    for (const selector of productPatterns) {
      $(selector).each((_, el) => {
        const href = $(el).attr("href");
        if (href && !urls.includes(href)) {
          urls.push(this.resolveUrl(href, html));
        }
      });
      if (urls.length > 0) break;
    }

    return [...new Set(urls)];
  }

  // ─── 상품 상세 파싱 ───

  parseProductDetail(html: string, url: string): CrawledProduct | null {
    // 1) JSON-LD 구조화 데이터 (가장 정확)
    const jsonLd = this.parseJsonLd(html, url);
    if (jsonLd) return jsonLd;

    // 2) OpenGraph + meta 태그
    return this.parseMetaTags(html, url);
  }

  // ─── JSON-LD 파서 ───

  private parseJsonLd(html: string, url: string): CrawledProduct | null {
    const $ = cheerio.load(html);

    let product: any = null;

    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || "");

        // 직접 Product 타입
        if (data["@type"] === "Product") {
          product = data;
          return false;
        }

        // @graph 배열 내 Product
        if (data["@graph"]) {
          const found = data["@graph"].find(
            (item: any) => item["@type"] === "Product"
          );
          if (found) {
            product = found;
            return false;
          }
        }

        // 중첩 구조 (BreadcrumbList + Product)
        if (Array.isArray(data)) {
          const found = data.find(
            (item: any) => item["@type"] === "Product"
          );
          if (found) {
            product = found;
            return false;
          }
        }
      } catch {
        // JSON 파싱 실패 무시
      }
    });

    if (!product?.name) return null;

    // 가격 추출
    const offers = product.offers || {};
    const offerItem = Array.isArray(offers) ? offers[0] : offers;
    const price = parseFloat(offerItem?.price || offerItem?.lowPrice || "0");

    // 이미지 추출
    let imageUrls: string[] = [];
    if (product.image) {
      const images = Array.isArray(product.image)
        ? product.image
        : [product.image];
      imageUrls = images
        .map((img: any) => (typeof img === "string" ? img : img?.url || ""))
        .filter(Boolean);
    }

    // 브랜드
    const brand =
      typeof product.brand === "string"
        ? product.brand
        : product.brand?.name || "Unknown";

    // 카테고리
    const category =
      typeof product.category === "string"
        ? product.category
        : product.category?.name;

    return {
      name: product.name,
      brandName: brand,
      categoryName: category || undefined,
      originalPrice: Math.round(price),
      salePrice: undefined,
      description: (product.description || "").slice(0, 500),
      imageUrls,
      sourceUrl: url,
      sourceSite: this.sourceSite,
    };
  }

  // ─── meta 태그 파서 ───

  private parseMetaTags(html: string, url: string): CrawledProduct | null {
    const $ = cheerio.load(html);

    const name =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="title"]').attr("content") ||
      $("h1").first().text().trim() ||
      $("title").text().trim();

    if (!name) return null;

    const brandName =
      $('meta[property="product:brand"]').attr("content") ||
      $('meta[name="brand"]').attr("content") ||
      $(".brand-name, .brand, [class*=brand]").first().text().trim() ||
      "Unknown";

    // 가격 — 다양한 OG/product 태그 폴백
    const priceAmount =
      this.parsePrice(
        $('meta[property="product:price:amount"]').attr("content")
      ) ||
      this.parsePrice(
        $('meta[property="og:price:amount"]').attr("content")
      ) ||
      this.parsePrice(
        $('meta[property="product:sale_price:amount"]').attr("content")
      ) ||
      this.parsePrice($('meta[name="price"]').attr("content")) ||
      this.parsePrice($('meta[itemprop="price"]').attr("content")) ||
      this.parsePrice(
        $('[itemprop="price"]').attr("content") ||
          $('[itemprop="price"]').text()
      ) ||
      // 일반 HTML 클래스에서 가격 추출
      this.parsePrice(
        $(".product-price, .price, .goods-price, [class*='price']")
          .first()
          .text()
      );

    const normalPrice =
      this.parsePrice(
        $('meta[property="product:price:normal_price"]').attr("content")
      ) ||
      this.parsePrice(
        $('meta[property="product:original_price:amount"]').attr("content")
      );

    const originalPrice = normalPrice || priceAmount || 0;
    const salePrice =
      normalPrice && priceAmount && priceAmount < normalPrice
        ? priceAmount
        : undefined;

    // 이미지
    const imageUrls: string[] = [];
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) imageUrls.push(ogImage);

    // 추가 이미지 (일반적 패턴)
    $(".product-image img, .detail-image img, .goods-image img").each(
      (_, el) => {
        const src =
          $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-original");
        if (src && !imageUrls.includes(src)) {
          imageUrls.push(src);
        }
      }
    );

    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";

    const categoryName =
      $('meta[property="product:category"]').attr("content") || undefined;

    // 가격이 0이면 이 상품은 skip (상세 파싱 실패로 간주)
    if (originalPrice === 0) return null;

    return {
      name: name
        .replace(/\s*[\|–-]\s*.*$/, "") // "상품명 | 사이트명" 정리
        .trim(),
      brandName,
      categoryName,
      originalPrice,
      salePrice,
      description: description?.slice(0, 500) || undefined,
      imageUrls,
      sourceUrl: url,
      sourceSite: this.sourceSite,
    };
  }

  // ─── 유틸 ───

  private parsePrice(text: string | undefined): number {
    if (!text) return 0;
    const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
    return isNaN(num) ? 0 : num;
  }

  /** 상대 URL → 절대 URL 변환 */
  private resolveUrl(href: string, html: string): string {
    if (href.startsWith("http")) return href;

    // base tag에서 기본 URL 추출
    const $ = cheerio.load(html);
    const baseUrl = $("base").attr("href") || "";

    if (href.startsWith("//")) return `https:${href}`;
    if (href.startsWith("/")) return `${baseUrl}${href}`;
    return href;
  }
}
