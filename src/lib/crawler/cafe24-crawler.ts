import * as cheerio from "cheerio";
import { BaseCrawler } from "./base-crawler";
import type { CrawledProduct } from "./types";

/**
 * Cafe24 크롤러 – 한국 쇼핑몰 플랫폼
 *
 * 국내 자사몰의 70%+ 가 Cafe24 기반.
 * 입점 브랜드 대부분이 Cafe24로 자사몰 운영.
 *
 * Cafe24 특징:
 *   - URL 패턴: /product/상품명/숫자/category/숫자/display/1/
 *   - 글로벌 변수: product_no, product_name, product_price
 *   - EC 전용 JS: EC_FRONT_JS_CONFIG_SHOP
 *   - JSON-LD 지원 (최신 테마)
 *   - meta property: product:price:amount, product:brand
 */
export class Cafe24Crawler extends BaseCrawler {
  readonly sourceSite = "cafe24";

  // ─── 목록 페이지 파싱 ───

  parseProductList(html: string): string[] {
    const $ = cheerio.load(html);
    const urls: string[] = [];
    const baseUrl = this.extractBaseUrl(html, $);

    // Cafe24 상품 링크 패턴
    const selectors = [
      'a[href*="/product/"]',
      'a[href*="product_no="]',
      ".prdList a",
      ".product-list a",
      "ul.prdList li a",
      ".thumbnail a",
      ".xans-product a[href]",
    ];

    for (const selector of selectors) {
      $(selector).each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        if (href.includes("/product/") || href.includes("product_no=")) {
          const fullUrl = href.startsWith("http")
            ? href
            : `${baseUrl}${href.startsWith("/") ? "" : "/"}${href}`;
          if (!urls.includes(fullUrl)) urls.push(fullUrl);
        }
      });
    }

    // product_no 패턴으로 추가 추출
    if (urls.length === 0) {
      const noPattern = /product_no[=:]\s*['"]?(\d+)/g;
      let m;
      while ((m = noPattern.exec(html)) !== null) {
        const fullUrl = `${baseUrl}/product/detail.html?product_no=${m[1]}`;
        if (!urls.includes(fullUrl)) urls.push(fullUrl);
      }
    }

    return [...new Set(urls)];
  }

  // ─── 상품 상세 파싱 ───

  parseProductDetail(html: string, url: string): CrawledProduct | null {
    // 1) Cafe24 글로벌 변수 추출
    const cafe24Data = this.parseCafe24Variables(html, url);
    if (cafe24Data) return cafe24Data;

    // 2) JSON-LD (최신 Cafe24 테마)
    const jsonLd = this.parseJsonLd(html, url);
    if (jsonLd) return jsonLd;

    // 3) meta 태그 폴백
    return this.parseMetaTags(html, url);
  }

  // ─── Cafe24 전역 변수 파서 ───

  private parseCafe24Variables(
    html: string,
    url: string
  ): CrawledProduct | null {
    try {
      const $ = cheerio.load(html);

      // Cafe24는 여러 전역 변수로 상품 정보를 노출
      // product_name, product_price, product_image 등

      let name = "";
      let brandName = "Unknown";
      let originalPrice = 0;
      let salePrice: number | undefined;

      // 상품명 추출
      const namePatterns = [
        /product_name\s*[=:]\s*['"]([^'"]+)['"]/,
        /var\s+product_name\s*=\s*['"]([^'"]+)['"]/,
        /"product_name"\s*:\s*"([^"]+)"/,
      ];
      for (const pat of namePatterns) {
        const m = html.match(pat);
        if (m?.[1]) {
          name = m[1];
          break;
        }
      }

      if (!name) {
        // HTML에서 상품명 추출
        name =
          $(".headingArea h2").text().trim() ||
          $(".product-name, .prd-name, #productName").text().trim() ||
          $("h1").first().text().trim();
      }

      if (!name) return null;

      // 가격 추출
      const pricePatterns = [
        /product_price\s*[=:]\s*['"]?(\d[\d,]*)/,
        /selling_price\s*[=:]\s*['"]?(\d[\d,]*)/,
        /"product_price"\s*:\s*"?(\d[\d,]*)/,
      ];
      for (const pat of pricePatterns) {
        const m = html.match(pat);
        if (m?.[1]) {
          originalPrice = parseInt(m[1].replace(/,/g, ""), 10);
          break;
        }
      }

      // 할인가
      const salePricePatterns = [
        /sale_price\s*[=:]\s*['"]?(\d[\d,]*)/,
        /discount_price\s*[=:]\s*['"]?(\d[\d,]*)/,
      ];
      for (const pat of salePricePatterns) {
        const m = html.match(pat);
        if (m?.[1]) {
          const sp = parseInt(m[1].replace(/,/g, ""), 10);
          if (sp > 0 && sp < originalPrice) salePrice = sp;
          break;
        }
      }

      // 브랜드
      const brandPatterns = [
        /product_brand\s*[=:]\s*['"]([^'"]+)['"]/,
        /manufacturer_name\s*[=:]\s*['"]([^'"]+)['"]/,
      ];
      for (const pat of brandPatterns) {
        const m = html.match(pat);
        if (m?.[1]) {
          brandName = m[1];
          break;
        }
      }
      if (brandName === "Unknown") {
        brandName =
          $('meta[property="product:brand"]').attr("content") ||
          $(".brand, .manufacturer").text().trim() ||
          "Unknown";
      }

      // 이미지
      const imageUrls: string[] = [];
      const ogImage = $('meta[property="og:image"]').attr("content");
      if (ogImage) imageUrls.push(ogImage);

      // Cafe24 상품 이미지
      $(
        ".keyImg img, .product-image img, #mainImage, .thumb img"
      ).each((_, el) => {
        const src =
          $(el).attr("src") ||
          $(el).attr("data-src") ||
          $(el).attr("data-original");
        if (src) {
          const fullSrc = src.startsWith("//")
            ? `https:${src}`
            : src.startsWith("/")
              ? `${this.extractBaseUrl(html, $)}${src}`
              : src;
          if (!imageUrls.includes(fullSrc)) imageUrls.push(fullSrc);
        }
      });

      // 추가 이미지
      $(
        ".xans-product-addimage img, .product-add-image img, .prdImgView img"
      ).each((_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src");
        if (src) {
          const fullSrc = src.startsWith("//") ? `https:${src}` : src;
          if (!imageUrls.includes(fullSrc)) imageUrls.push(fullSrc);
        }
      });

      // 카테고리
      const categoryName =
        $('meta[property="product:category"]').attr("content") ||
        $(".location .current, .breadcrumb li:last-child").text().trim() ||
        undefined;

      // 옵션/사이즈 추출
      const variants: CrawledProduct["variants"] = [];
      $("select[id*=option] option, select[name*=option] option").each(
        (_, el) => {
          const val = $(el).text().trim();
          if (val && !val.includes("선택") && !val.includes("---")) {
            variants.push({ size: val, stock: 100 });
          }
        }
      );

      // 설명
      const description =
        $('meta[property="og:description"]').attr("content") ||
        $(".product-description, .prd-detail").text().trim().slice(0, 500) ||
        "";

      return {
        name,
        brandName,
        categoryName,
        originalPrice: originalPrice || this.parsePriceFromMeta($),
        salePrice,
        description: description || undefined,
        imageUrls: [...new Set(imageUrls)],
        sourceUrl: url,
        sourceSite: this.sourceSite,
        variants: variants.length > 0 ? variants : undefined,
      };
    } catch {
      return null;
    }
  }

  // ─── JSON-LD 파서 ───

  private parseJsonLd(html: string, url: string): CrawledProduct | null {
    const $ = cheerio.load(html);

    let product: any = null;
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || "");
        if (data["@type"] === "Product") {
          product = data;
          return false;
        }
        if (data["@graph"]) {
          const found = data["@graph"].find(
            (item: any) => item["@type"] === "Product"
          );
          if (found) {
            product = found;
            return false;
          }
        }
      } catch {}
    });

    if (!product?.name) return null;

    const offers = product.offers || {};
    const offerItem = Array.isArray(offers) ? offers[0] : offers;
    const price = parseFloat(offerItem?.price || "0");

    let imageUrls: string[] = [];
    if (product.image) {
      const images = Array.isArray(product.image)
        ? product.image
        : [product.image];
      imageUrls = images
        .map((img: any) => (typeof img === "string" ? img : img?.url || ""))
        .filter(Boolean);
    }

    const brand =
      typeof product.brand === "string"
        ? product.brand
        : product.brand?.name || "Unknown";

    return {
      name: product.name,
      brandName: brand,
      categoryName:
        typeof product.category === "string"
          ? product.category
          : product.category?.name,
      originalPrice: Math.round(price),
      description: (product.description || "").slice(0, 500),
      imageUrls,
      sourceUrl: url,
      sourceSite: this.sourceSite,
    };
  }

  // ─── meta 태그 폴백 ───

  private parseMetaTags(html: string, url: string): CrawledProduct | null {
    const $ = cheerio.load(html);

    const name =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text().trim();
    if (!name) return null;

    const brandName =
      $('meta[property="product:brand"]').attr("content") || "Unknown";
    const originalPrice = this.parsePriceFromMeta($);

    const imageUrls: string[] = [];
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) imageUrls.push(ogImage);

    return {
      name: name.replace(/\s*[\|–-]\s*.*$/, "").trim(),
      brandName,
      originalPrice,
      description:
        $('meta[property="og:description"]').attr("content")?.slice(0, 500) ||
        undefined,
      imageUrls,
      sourceUrl: url,
      sourceSite: this.sourceSite,
    };
  }

  // ─── 유틸 ───

  private extractBaseUrl(html: string, $: cheerio.CheerioAPI): string {
    const canonical = $('link[rel="canonical"]').attr("href");
    if (canonical) {
      try {
        const u = new URL(canonical);
        return `${u.protocol}//${u.host}`;
      } catch {}
    }
    const ogUrl = $('meta[property="og:url"]').attr("content");
    if (ogUrl) {
      try {
        const u = new URL(ogUrl);
        return `${u.protocol}//${u.host}`;
      } catch {}
    }
    return "";
  }

  private parsePriceFromMeta($: cheerio.CheerioAPI): number {
    const text =
      $('meta[property="product:price:amount"]').attr("content") ||
      $('meta[property="product:price:normal_price"]').attr("content") ||
      "";
    const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
    return isNaN(num) ? 0 : num;
  }
}
