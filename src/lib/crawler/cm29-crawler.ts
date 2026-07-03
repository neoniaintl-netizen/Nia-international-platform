import * as cheerio from "cheerio";
import { BaseCrawler } from "./base-crawler";
import type { CrawledProduct } from "./types";

/**
 * 29CM 크롤러
 *
 * 29CM 특징:
 *   - Next.js 기반 (pages/app router 혼용)
 *   - URL 패턴: /products/숫자, /product/숫자
 *   - __NEXT_DATA__ 에 상품 정보 포함
 *   - meta 태그: product:price:amount, product:brand
 *   - JSON-LD 구조화 데이터 (최신 버전)
 *
 * 3단계 폴백: __NEXT_DATA__ → JSON-LD → meta 태그
 */
export class Cm29Crawler extends BaseCrawler {
  readonly sourceSite = "29cm";

  // ─── 목록 페이지 파싱 ───

  parseProductList(html: string): string[] {
    const $ = cheerio.load(html);
    const urls: string[] = [];

    // /products/{숫자} 또는 /product/{숫자} 패턴
    $('a[href*="/product"]').each((_, el) => {
      const href = $(el).attr("href");
      if (href) {
        const match = href.match(/\/products?\/(\d+)/);
        if (match) {
          const fullUrl = `https://shop.29cm.co.kr/products/${match[1]}`;
          if (!urls.includes(fullUrl)) urls.push(fullUrl);
        }
      }
    });

    // 백업: itemNo / goodsNo 패턴
    if (urls.length === 0) {
      const patterns = [/"itemNo"\s*:\s*(\d+)/g, /"goodsNo"\s*:\s*(\d+)/g];
      for (const pattern of patterns) {
        let m;
        while ((m = pattern.exec(html)) !== null) {
          const fullUrl = `https://shop.29cm.co.kr/products/${m[1]}`;
          if (!urls.includes(fullUrl)) urls.push(fullUrl);
        }
      }
    }

    // 백업: 일반 상품 링크 패턴
    if (urls.length === 0) {
      const selectors = [
        '[class*="product"] a[href]',
        '[class*="item"] a[href]',
        'a[href*="/goods/"]',
      ];
      for (const selector of selectors) {
        $(selector).each((_, el) => {
          const href = $(el).attr("href");
          if (href) {
            const fullUrl = href.startsWith("http")
              ? href
              : `https://shop.29cm.co.kr${href.startsWith("/") ? "" : "/"}${href}`;
            if (!urls.includes(fullUrl)) urls.push(fullUrl);
          }
        });
        if (urls.length > 0) break;
      }
    }

    return [...new Set(urls)];
  }

  // ─── 상품 상세 파싱 ───

  parseProductDetail(html: string, url: string): CrawledProduct | null {
    // 1) __NEXT_DATA__ (가장 정확)
    const nextData = this.parseNextData(html, url);
    if (nextData) return nextData;

    // 2) JSON-LD
    const jsonLd = this.parseJsonLd(html, url);
    if (jsonLd) return jsonLd;

    // 3) meta 태그 폴백
    return this.parseMetaTags(html, url);
  }

  // ─── __NEXT_DATA__ 파서 ───

  private parseNextData(html: string, url: string): CrawledProduct | null {
    try {
      const match = html.match(
        /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
      );
      if (!match?.[1]) return null;

      const data = JSON.parse(match[1]);
      const pageProps = data?.props?.pageProps;
      if (!pageProps) return null;

      // 다양한 경로 시도
      const product =
        pageProps.product ||
        pageProps.item ||
        pageProps.data?.product ||
        pageProps.initialData?.product;
      if (!product) return null;

      const name = product.itemName || product.name || product.title;
      if (!name) return null;

      const originalPrice =
        product.consumerPrice || product.originalPrice || product.price || 0;
      const salePrice = product.salePrice || product.sellingPrice;

      // 이미지
      const imageUrls: string[] = [];
      if (product.thumbnailImageUrl || product.imageUrl) {
        imageUrls.push(product.thumbnailImageUrl || product.imageUrl);
      }
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
        product.frontBrandName ||
        "Unknown";

      const categoryName =
        product.categoryName ||
        product.category?.name ||
        product.frontCategoryName;

      // 옵션
      const variants: CrawledProduct["variants"] = [];
      const options = product.options || product.optionItems;
      if (options && Array.isArray(options)) {
        for (const opt of options) {
          variants.push({
            size: opt.name || opt.optionName || opt.value,
            stock: opt.stockCount ?? opt.stock ?? 100,
          });
        }
      }

      return {
        name,
        brandName,
        categoryName: categoryName || undefined,
        originalPrice,
        salePrice:
          salePrice && salePrice < originalPrice ? salePrice : undefined,
        description: (product.description || product.itemDescription || "")
          .replace(/<[^>]*>/g, "")
          .slice(0, 500) || undefined,
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
      $("h2.prd_name").text().trim() ||
      $('[class*="product-name"]').first().text().trim() ||
      $("h1").first().text().trim();

    if (!name) return null;

    const brandName =
      $('meta[property="product:brand"]').attr("content") ||
      $(".brand_name a").text().trim() ||
      "Unknown";

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

    $('[class*="product-image"] img, .prd_gallery img').each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src && !imageUrls.includes(src)) {
        imageUrls.push(src.startsWith("//") ? `https:${src}` : src);
      }
    });

    // 옵션
    const variants: CrawledProduct["variants"] = [];
    $("select option, [data-size]").each((_, el) => {
      const size = $(el).text().trim() || $(el).attr("data-size");
      if (
        size &&
        !["선택", "사이즈", "옵션", "---"].some((k) => size.includes(k))
      ) {
        variants.push({ size, stock: 100 });
      }
    });

    return {
      name: name.replace(/\s*[\|–-]\s*29CM.*$/, "").trim(),
      brandName,
      categoryName:
        $('meta[property="product:category"]').attr("content") || undefined,
      originalPrice,
      salePrice,
      description:
        $('meta[property="og:description"]').attr("content")?.slice(0, 500) ||
        undefined,
      imageUrls,
      sourceUrl: url,
      sourceSite: this.sourceSite,
      variants: variants.length > 0 ? variants : undefined,
    };
  }
}
