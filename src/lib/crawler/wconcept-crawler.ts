import * as cheerio from "cheerio";
import { BaseCrawler } from "./base-crawler";
import type { CrawledProduct } from "./types";

/**
 * W Concept 크롤러
 *
 * W Concept 특징:
 *   - URL 패턴: /Product/숫자, /product/Detail/숫자
 *   - 주로 프리미엄/디자이너 브랜드
 *   - meta 태그 기반 (og:*, product:*)
 *   - JSON-LD 구조화 데이터
 *   - 상품 데이터 window.__INITIAL_STATE__ 또는 __NEXT_DATA__
 */
export class WConceptCrawler extends BaseCrawler {
  readonly sourceSite = "wconcept";

  // ─── 목록 페이지 파싱 ───

  parseProductList(html: string): string[] {
    const $ = cheerio.load(html);
    const urls: string[] = [];

    // W Concept 상품 링크 패턴
    const selectors = [
      'a[href*="/Product/"]',
      'a[href*="/product/"]',
      'a[href*="itemCode="]',
      ".product-item a",
      ".goods-item a",
    ];

    for (const selector of selectors) {
      $(selector).each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        if (
          href.includes("/Product/") ||
          href.includes("/product/") ||
          href.includes("itemCode=")
        ) {
          const fullUrl = href.startsWith("http")
            ? href
            : `https://www.wconcept.co.kr${href.startsWith("/") ? "" : "/"}${href}`;
          if (!urls.includes(fullUrl)) urls.push(fullUrl);
        }
      });
      if (urls.length > 0) break;
    }

    // 백업: itemCode / productNo 패턴
    if (urls.length === 0) {
      const patterns = [
        /"itemCode"\s*:\s*"?(\d+)/g,
        /"productNo"\s*:\s*"?(\d+)/g,
      ];
      for (const pattern of patterns) {
        let m;
        while ((m = pattern.exec(html)) !== null) {
          const fullUrl = `https://www.wconcept.co.kr/Product/${m[1]}`;
          if (!urls.includes(fullUrl)) urls.push(fullUrl);
        }
      }
    }

    return [...new Set(urls)];
  }

  // ─── 상품 상세 파싱 ───

  parseProductDetail(html: string, url: string): CrawledProduct | null {
    // 1) __NEXT_DATA__ 또는 __INITIAL_STATE__
    const stateData = this.parseStateData(html, url);
    if (stateData) return stateData;

    // 2) JSON-LD
    const jsonLd = this.parseJsonLd(html, url);
    if (jsonLd) return jsonLd;

    // 3) meta 태그 폴백
    return this.parseMetaTags(html, url);
  }

  // ─── 상태 데이터 파서 ───

  private parseStateData(html: string, url: string): CrawledProduct | null {
    try {
      // __NEXT_DATA__ 시도
      const nextMatch = html.match(
        /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
      );
      if (nextMatch?.[1]) {
        const data = JSON.parse(nextMatch[1]);
        const pageProps = data?.props?.pageProps;
        const product =
          pageProps?.product || pageProps?.item || pageProps?.data?.product;
        if (product?.name || product?.itemName) {
          return this.extractFromObject(product, url);
        }
      }

      // __INITIAL_STATE__ 시도
      const stateMatch = html.match(
        /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/
      );
      if (stateMatch?.[1]) {
        const state = JSON.parse(stateMatch[1]);
        const product = state?.product?.detail || state?.productDetail;
        if (product) {
          return this.extractFromObject(product, url);
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  private extractFromObject(product: any, url: string): CrawledProduct | null {
    const name =
      product.itemName || product.name || product.productName || product.title;
    if (!name) return null;

    const originalPrice =
      product.consumerPrice ||
      product.originalPrice ||
      product.normalPrice ||
      product.price ||
      0;
    const salePrice =
      product.salePrice || product.sellingPrice || product.sellPrice;

    const imageUrls: string[] = [];
    const mainImg =
      product.thumbnailImageUrl ||
      product.imageUrl ||
      product.mainImageUrl;
    if (mainImg) imageUrls.push(mainImg);

    if (product.images && Array.isArray(product.images)) {
      for (const img of product.images) {
        const imgUrl =
          typeof img === "string" ? img : img?.url || img?.imageUrl;
        if (imgUrl && !imageUrls.includes(imgUrl)) imageUrls.push(imgUrl);
      }
    }

    const brandName =
      product.brandName ||
      product.brand?.name ||
      product.brandInfo?.brandName ||
      "Unknown";

    const variants: CrawledProduct["variants"] = [];
    const options = product.options || product.optionItems || product.sizes;
    if (options && Array.isArray(options)) {
      for (const opt of options) {
        variants.push({
          size: opt.name || opt.optionName || opt.value || opt.sizeName,
          stock: opt.stockCount ?? opt.stock ?? 100,
        });
      }
    }

    return {
      name,
      brandName,
      categoryName:
        product.categoryName || product.category?.name || undefined,
      originalPrice,
      salePrice:
        salePrice && salePrice < originalPrice ? salePrice : undefined,
      description: (product.description || "")
        .replace(/<[^>]*>/g, "")
        .slice(0, 500) || undefined,
      imageUrls: [...new Set(imageUrls)],
      sourceUrl: url,
      sourceSite: this.sourceSite,
      variants: variants.length > 0 ? variants : undefined,
    };
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

    let imageUrls: string[] = [];
    if (product.image) {
      const images = Array.isArray(product.image)
        ? product.image
        : [product.image];
      imageUrls = images
        .map((img: any) => (typeof img === "string" ? img : img?.url || ""))
        .filter(Boolean);
    }

    return {
      name: product.name,
      brandName:
        typeof product.brand === "string"
          ? product.brand
          : product.brand?.name || "Unknown",
      originalPrice: Math.round(parseFloat(offerItem?.price || "0")),
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

    const priceAmount = this.parsePrice(
      $('meta[property="product:price:amount"]').attr("content")
    );
    const normalPrice = this.parsePrice(
      $('meta[property="product:price:normal_price"]').attr("content")
    );

    const originalPrice = normalPrice || priceAmount || 0;
    const salePrice =
      normalPrice && priceAmount && priceAmount < normalPrice
        ? priceAmount
        : undefined;

    const imageUrls: string[] = [];
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) imageUrls.push(ogImage);

    return {
      name: name.replace(/\s*[\|–-]\s*W\s*CONCEPT.*$/i, "").trim(),
      brandName,
      originalPrice,
      salePrice,
      description:
        $('meta[property="og:description"]').attr("content")?.slice(0, 500) ||
        undefined,
      imageUrls,
      sourceUrl: url,
      sourceSite: this.sourceSite,
    };
  }
}
