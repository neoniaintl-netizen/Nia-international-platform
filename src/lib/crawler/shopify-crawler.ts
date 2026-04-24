import * as cheerio from "cheerio";
import { BaseCrawler } from "./base-crawler";
import type { CrawledProduct } from "./types";

/**
 * Shopify SSR 사이트 공용 크롤러
 *
 * 타겟: Salomon, Wilson, Alo Yoga 등 Shopify 기반 브랜드몰
 *
 * Shopify 공통 구조:
 *   - 리스팅: /collections/{slug} — SSR로 모든 상품 카드 렌더
 *   - 상세: /products/{handle} — JSON-LD + og:* 메타 + 선택적 /products/{handle}.json
 *
 * 데이터 소스 우선순위:
 *   1) JSON-LD `@type: Product` (가장 정확)
 *   2) OpenGraph meta (product:price:amount, og:image 등)
 *   3) ShopifyAnalytics.meta.product 전역 변수 (fallback)
 */
export class ShopifyCrawler extends BaseCrawler {
  readonly sourceSite = "shopify";

  // ─────────────────────────────────────
  //  목록 페이지 파싱
  // ─────────────────────────────────────

  parseProductList(html: string): string[] {
    const $ = cheerio.load(html);
    const urls = new Set<string>();

    // base URL 추출 (canonical or og:url → 도메인 확보)
    const baseHost = this.extractBaseHost($);

    $('a[href*="/products/"]').each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;

      // /products/{handle} 형태만 채택 (예: /products/running-shoes-black)
      const match = href.match(/\/products\/([a-zA-Z0-9][a-zA-Z0-9\-_%]*)/);
      if (!match) return;

      const handle = match[1];
      // 상품 옵션 파라미터 제거 (?variant=xxx)
      const cleanPath = `/products/${handle}`;
      const fullUrl = href.startsWith("http")
        ? href.split("?")[0]
        : `${baseHost}${cleanPath}`;

      // 장바구니, 계정 등 시스템 경로 제외
      if (fullUrl.includes("/cart") || fullUrl.includes("/account")) return;

      urls.add(fullUrl);
    });

    return Array.from(urls);
  }

  // ─────────────────────────────────────
  //  상품 상세 파싱
  // ─────────────────────────────────────

  parseProductDetail(html: string, url: string): CrawledProduct | null {
    // 1) JSON-LD 우선 (가격/이름/기본 이미지)
    const jsonLd = this.parseJsonLd(html, url);
    let result: CrawledProduct | null = null;

    if (jsonLd && jsonLd.originalPrice > 0) {
      result = jsonLd;
    } else {
      // 2) OpenGraph 태그 폴백
      const og = this.parseMetaTags(html, url);
      if (og) {
        result = og;
      } else {
        // 3) ShopifyAnalytics 전역 변수 (마지막 수단)
        result = this.parseShopifyAnalytics(html, url);
      }
    }

    if (!result) return null;

    // === 이미지 다중 수집 ===
    const extraImages = this.extractAllProductImages(html, url);
    const $dom = this.load(html);
    const helperImages = this.collectImages($dom, {
      gallerySelectors: [
        ".product__media img",
        ".product-single__photo img",
        ".product-gallery img",
        "[id^='ProductMedia-'] img",
        ".product-form__media img",
      ],
      detailContainers: [".product__description", ".rte", "[class*='product-description']"],
    });
    const mergedImages = Array.from(
      new Set([...(result.imageUrls ?? []), ...extraImages, ...helperImages])
    );
    result.imageUrls = mergedImages;

    // 상세 설명 HTML
    const richDesc = this.extractDescriptionHtml($dom, [
      ".product__description",
      ".rte",
      "[class*='product-description']",
    ]);
    if (richDesc) result.description = richDesc;

    return result;
  }

  /** 상세 페이지의 모든 제품 이미지 수집 (Shopify 표준 + fallback) */
  private extractAllProductImages(html: string, url: string): string[] {
    const $ = cheerio.load(html);
    const images = new Set<string>();

    // Shopify 표준 셀렉터
    const selectors = [
      ".product__media img",
      ".product-single__photo img",
      ".product-gallery img",
      "[id^='ProductMedia-'] img",
      ".product-form__media img",
      "[data-product-image]",
      "img[src*='/cdn/shop/']",
      "img[src*='shopifycdn']",
    ];
    for (const sel of selectors) {
      $(sel).each((_, el) => {
        let src =
          $(el).attr("src") ||
          $(el).attr("data-src") ||
          $(el).attr("data-srcset")?.split(",")[0]?.trim().split(" ")[0] ||
          $(el).attr("srcset")?.split(",")[0]?.trim().split(" ")[0];
        if (!src) return;
        const normalized = this.normalizeImageUrl(src);
        // 품질 필터: 2000x, 1600x, 1200x 같은 대형 이미지 우선
        if (
          normalized.includes("/cdn/shop/") ||
          normalized.includes("shopifycdn")
        ) {
          // 크기 축소된 버전을 큰 버전으로 업그레이드
          const upgraded = normalized.replace(
            /_(\d+)x(\d+)?\./,
            "_2000x."
          );
          images.add(upgraded);
        }
      });
    }

    // JSON-LD image 배열 전체
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || "");
        const product = this.findProductInJsonLd(data);
        if (product?.image) {
          const imgs = Array.isArray(product.image)
            ? product.image
            : [product.image];
          for (const img of imgs) {
            const u = typeof img === "string" ? img : img?.url;
            if (u) images.add(this.normalizeImageUrl(u));
          }
        }
      } catch {}
    });

    return Array.from(images);
  }

  private findProductInJsonLd(data: any): any {
    if (data["@type"] === "Product") return data;
    if (data["@graph"]) {
      return data["@graph"].find((i: any) => i["@type"] === "Product");
    }
    if (Array.isArray(data)) {
      return data.find((i: any) => i["@type"] === "Product");
    }
    return null;
  }

  // ─── JSON-LD 파서 ───

  private parseJsonLd(html: string, url: string): CrawledProduct | null {
    const $ = cheerio.load(html);
    let product: any = null;

    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const raw = $(el).html();
        if (!raw) return;
        const data = JSON.parse(raw);

        // 직접 Product
        if (data["@type"] === "Product") {
          product = data;
          return false;
        }
        // @graph 배열
        if (data["@graph"]) {
          const found = data["@graph"].find(
            (item: any) => item["@type"] === "Product"
          );
          if (found) {
            product = found;
            return false;
          }
        }
        // 배열 전체
        if (Array.isArray(data)) {
          const found = data.find((item: any) => item["@type"] === "Product");
          if (found) {
            product = found;
            return false;
          }
        }
      } catch {}
    });

    if (!product?.name) return null;

    // 가격
    const offers = product.offers;
    const offerItem = Array.isArray(offers) ? offers[0] : offers;
    const priceRaw = offerItem?.price ?? offerItem?.lowPrice ?? "0";
    const price = Math.round(parseFloat(String(priceRaw)));
    const listPrice = offerItem?.priceSpecification?.price
      ? Math.round(parseFloat(String(offerItem.priceSpecification.price)))
      : 0;

    // 이미지
    const imageUrls: string[] = [];
    if (product.image) {
      const imgs = Array.isArray(product.image) ? product.image : [product.image];
      for (const img of imgs) {
        const u = typeof img === "string" ? img : img?.url;
        if (u) imageUrls.push(this.normalizeImageUrl(u));
      }
    }

    // 브랜드 — URL 도메인 기반이 가장 신뢰성 높음 (JSON-LD는 대소문자/suffix 변동)
    const brand = this.inferBrandFromUrl(url);

    return {
      name: String(product.name).trim(),
      brandName: brand,
      categoryName: this.extractCategory(product, $),
      originalPrice: listPrice > price ? listPrice : price,
      salePrice: listPrice > price ? price : undefined,
      description: String(product.description || "").slice(0, 500) || undefined,
      imageUrls,
      sourceUrl: url,
      sourceSite: this.sourceSite,
    };
  }

  // ─── OpenGraph 파서 ───

  private parseMetaTags(html: string, url: string): CrawledProduct | null {
    const $ = cheerio.load(html);

    const name =
      $('meta[property="og:title"]').attr("content") ||
      $("h1").first().text().trim() ||
      "";
    if (!name) return null;

    const priceAmount = this.parsePrice(
      $('meta[property="og:price:amount"]').attr("content") ||
        $('meta[property="product:price:amount"]').attr("content")
    );
    if (priceAmount === 0) return null;

    // Shopify는 종종 normal_price를 표기하지 않음 — JSON-LD 재확인
    const imageUrls: string[] = [];
    $('meta[property="og:image"]').each((_, el) => {
      const src = $(el).attr("content");
      if (src) imageUrls.push(this.normalizeImageUrl(src));
    });
    // 상세 이미지 추가: .product__media img, [id^="ProductMedia-"] img
    $('.product__media img, .product-single__photo img, [id^="ProductMedia-"] img').each((_, el) => {
      const src =
        $(el).attr("src") ||
        $(el).attr("data-src") ||
        $(el).attr("data-srcset")?.split(" ")[0];
      if (src) {
        const abs = this.normalizeImageUrl(src);
        if (!imageUrls.includes(abs)) imageUrls.push(abs);
      }
    });

    // URL 도메인 기반 브랜드 매칭 우선 (일관성 확보)
    const brandName = this.inferBrandFromUrl(url);

    return {
      name: name.replace(/\s*[\|–\-—]\s*.*$/, "").trim(),
      brandName,
      originalPrice: priceAmount,
      description:
        $('meta[property="og:description"]').attr("content")?.slice(0, 500) ||
        undefined,
      imageUrls,
      sourceUrl: url,
      sourceSite: this.sourceSite,
    };
  }

  // ─── ShopifyAnalytics 전역 변수 ───

  private parseShopifyAnalytics(html: string, url: string): CrawledProduct | null {
    const match = html.match(
      /ShopifyAnalytics\.meta\s*=\s*({[\s\S]*?});[\s\S]*?<\/script>/
    );
    if (!match) return null;
    try {
      const data = JSON.parse(match[1]);
      const product = data.product || data.page?.product;
      if (!product?.id) return null;

      const priceCents = product.variants?.[0]?.price || product.price || 0;
      const price = Math.round(Number(priceCents) / 100);

      return {
        name: product.title || "Unknown",
        brandName: product.vendor || this.inferBrandFromUrl(url),
        originalPrice: price,
        imageUrls: [],
        sourceUrl: url,
        sourceSite: this.sourceSite,
      };
    } catch {
      return null;
    }
  }

  // ─── 유틸리티 ───

  private parsePrice(text: string | undefined): number {
    if (!text) return 0;
    // 소수점이 있으면 그대로, 아니면 정수
    const hasDecimal = /\.\d{2}$/.test(text);
    if (hasDecimal) return Math.round(parseFloat(text));
    const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
    return isNaN(num) ? 0 : num;
  }

  private normalizeImageUrl(src: string): string {
    if (!src) return src;
    if (src.startsWith("//")) return `https:${src}`;
    if (src.startsWith("http")) return src;
    return src;
  }

  private extractBaseHost($: cheerio.CheerioAPI): string {
    const canonical = $('link[rel="canonical"]').attr("href");
    const ogUrl = $('meta[property="og:url"]').attr("content");
    const base = canonical || ogUrl;
    if (base) {
      try {
        const u = new URL(base);
        return `${u.protocol}//${u.host}`;
      } catch {}
    }
    return "";
  }

  private inferBrandFromUrl(url: string): string {
    try {
      const host = new URL(url).hostname.toLowerCase();
      if (host.includes("salomon")) return "Salomon";
      if (host.includes("wilson")) return "Wilson";
      if (host.includes("aloyoga")) return "Alo Yoga";
      if (host.includes("patagonia")) return "Patagonia";
      if (host.includes("arcteryx")) return "Arc'teryx";
      if (host.includes("thenorthface")) return "The North Face";
      if (host.includes("kolonsport")) return "Kolon Sport";
      if (host.includes("descente") || host.includes("dk-on")) return "Descente";
      return host.replace(/^www\.|\.com|\.co\.kr$/g, "");
    } catch {
      return "Unknown";
    }
  }

  private extractCategory(product: any, $: cheerio.CheerioAPI): string | undefined {
    if (typeof product.category === "string") return product.category;
    if (product.category?.name) return product.category.name;

    // Shopify breadcrumb selectors
    const crumbs: string[] = [];
    $(".breadcrumb a, nav[aria-label*=breadcrumb] a, .breadcrumbs a").each(
      (_, el) => {
        const text = $(el).text().trim();
        if (text && !/home|홈/i.test(text)) crumbs.push(text);
      }
    );
    return crumbs[crumbs.length - 1] || undefined;
  }
}
