import * as cheerio from "cheerio";
import { BaseCrawler } from "./base-crawler";
import type { CrawledProduct } from "./types";

/**
 * The North Face Korea 전용 크롤러
 * 타겟: thenorthfacekorea.co.kr
 *
 * 구조:
 *   - 카테고리: /category/n/{gender}/{type}  (예: /category/n/men/jacket-vest)
 *   - 상세: /product/{CODE}  (예: /product/NJ3LS13B, /product/4000057152)
 *
 * 데이터 소스:
 *   - OG 태그 (og:title, og:description, og:image)
 *   - 이미지 CDN: image.thenorthfacekorea.co.kr/cmsstatic/product/{CODE}_{n}_primary.jpg
 *   - 가격: HTML DOM의 특정 클래스/텍스트 스크랩
 */
export class NorthFaceCrawler extends BaseCrawler {
  readonly sourceSite = "northface";

  parseProductList(html: string): string[] {
    const urls = new Set<string>();

    // /product/{CODE} 패턴 추출 — 알파벳 코드(NJ3LS13B) + 숫자 ID(4000057151) 둘 다
    const regex = /\/product\/([A-Z0-9]{6,})/g;
    let m;
    while ((m = regex.exec(html)) !== null) {
      const code = m[1];
      urls.add(`https://www.thenorthfacekorea.co.kr/product/${code}`);
    }

    return Array.from(urls);
  }

  parseProductDetail(html: string, url: string): CrawledProduct | null {
    const $ = cheerio.load(html);

    // ─── 상품명 (og:title 우선, h1 폴백) ───
    let name =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="title"]').attr("content") ||
      $("h1").first().text().trim() ||
      $("title").text().trim();

    if (!name) return null;

    // "상품명 | 노스페이스" 같은 suffix 제거
    name = name.replace(/\s*[\|–\-—]\s*.*(노스페이스|North Face|NorthFace).*$/i, "").trim();
    // "브랜드명 " prefix 제거
    name = name.replace(/^(노스페이스|THE NORTH FACE|The North Face)\s+/i, "").trim();

    // ─── 가격 ───
    const price = this.extractPrice(html, $);
    if (price.original === 0) return null;

    // ─── 이미지 ───
    const imageUrls = this.extractImages(html, url, $);
    if (imageUrls.length === 0) return null;

    // ─── 설명 ───
    const description =
      $('meta[property="og:description"]').attr("content")?.slice(0, 500) ||
      $('meta[name="description"]').attr("content")?.slice(0, 500) ||
      undefined;

    // 상품코드 추출 (URL에서)
    const codeMatch = url.match(/\/product\/([A-Z0-9]+)/);
    const productCode = codeMatch?.[1];

    // 카테고리 추론 (URL 경로 분석 또는 breadcrumb)
    const categoryName = this.extractCategory($);

    return {
      name,
      brandName: "The North Face",
      categoryName,
      originalPrice: price.original,
      salePrice: "sale" in price ? price.sale : undefined,
      description,
      imageUrls,
      sourceUrl: url,
      sourceSite: this.sourceSite,
      tags: productCode ? [productCode] : undefined,
    };
  }

  // ─── 가격 추출 ───
  private extractPrice(
    html: string,
    $: cheerio.CheerioAPI
  ): { original: number; sale?: number } | { original: 0 } {
    // 1) og:price:amount 또는 meta 가격
    const ogPrice = this.parsePrice(
      $('meta[property="og:price:amount"]').attr("content") ||
        $('meta[property="product:price:amount"]').attr("content")
    );

    // 2) __PRODUCT_INFO__ 전역변수 (있으면 가장 정확)
    const jsPrice = this.extractJsVariablePrice(html);

    // 3) HTML DOM 클래스 — 여러 패턴 시도
    const domPrice =
      this.parsePrice($(".price-total").first().text()) ||
      this.parsePrice($(".xans-product-price").first().text()) ||
      this.parsePrice($(".product-price").first().text()) ||
      this.parsePrice($(".goodsPrice").first().text()) ||
      this.parsePrice($(".priceSale").first().text()) ||
      this.parsePrice($("strong:contains('원')").first().text()) ||
      this.parsePrice(
        html.match(/price["\s:]+([0-9,]+)/i)?.[1]
      );

    const originalDom =
      this.parsePrice($(".priceOriginal, .price-retail, .retail-price").first().text()) ||
      this.parsePrice($(".xans-product-retail").first().text());

    const original = jsPrice.original || ogPrice || domPrice || 0;
    const sale =
      jsPrice.sale ||
      (originalDom > 0 && domPrice > 0 && domPrice < originalDom
        ? domPrice
        : undefined);

    if (original === 0) return { original: 0 };
    return { original, sale };
  }

  private extractJsVariablePrice(
    html: string
  ): { original: number; sale?: number } {
    // NorthFace 사이트 패턴: 전역변수 또는 dataLayer에서 가격 추출
    const patterns = [
      /"price"\s*:\s*"?([0-9,]+)"?/,
      /"salePrice"\s*:\s*"?([0-9,]+)"?/,
      /'goodsPrice'\s*:\s*'?([0-9,]+)'?/,
      /goodsPrice\s*=\s*['"]?([0-9,]+)['"]?/,
      /price_retail['"]?\s*:\s*['"]?([0-9,]+)['"]?/,
    ];

    let original = 0;
    let sale: number | undefined;

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const val = this.parsePrice(match[1]);
        if (val > 0 && original === 0) original = val;
      }
    }

    return { original, sale };
  }

  // ─── 이미지 추출 ───
  private extractImages(html: string, url: string, $: cheerio.CheerioAPI): string[] {
    const images = new Set<string>();

    // 1) og:image (가장 정확한 메인 이미지)
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) {
      const resolved = this.resolveImageUrl(ogImage);
      if (
        resolved &&
        !resolved.includes("share-url-img") && // placeholder 제외
        !resolved.endsWith("-NF.png")
      ) {
        images.add(resolved);
      }
    }

    // 2) image.thenorthfacekorea.co.kr CDN에서 제공되는 모든 상품 이미지
    $("img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-original");
      if (!src) return;
      const resolved = this.resolveImageUrl(src);
      if (
        resolved &&
        resolved.includes("image.thenorthfacekorea.co.kr") &&
        resolved.includes("/product/") &&
        !resolved.includes("icon")
      ) {
        images.add(resolved);
      }
    });

    // 3) 상품코드 기반 이미지 URL 생성 (fallback)
    const codeMatch = url.match(/\/product\/([A-Z0-9]+)/);
    if (codeMatch && images.size === 0) {
      const code = codeMatch[1];
      images.add(
        `https://image.thenorthfacekorea.co.kr/cmsstatic/product/${code}_${code}_primary.jpg`
      );
    }

    // 쿼리 파라미터(?thumbnail 등) 제거 — 원본 고해상도 버전 사용
    return Array.from(images)
      .map((u) => u.split("?")[0])
      .slice(0, 6);
  }

  private resolveImageUrl(src: string): string {
    if (!src) return "";
    let resolved = src;
    if (src.startsWith("//")) resolved = `https:${src}`;
    else if (src.startsWith("/")) resolved = `https://www.thenorthfacekorea.co.kr${src}`;
    else if (!src.startsWith("http")) return "";
    // 저해상도 thumbnail 쿼리 제거 (고화질 원본 사용)
    resolved = resolved.replace(/\?thumbnail\b/i, "").replace(/&thumbnail\b/i, "");
    return resolved;
  }

  private extractCategory($: cheerio.CheerioAPI): string | undefined {
    const breadcrumb: string[] = [];
    $(".breadcrumb a, .location a, nav[aria-label*=breadcrumb] a").each(
      (_, el) => {
        const text = $(el).text().trim();
        if (text && !/홈|home/i.test(text)) breadcrumb.push(text);
      }
    );
    // "아웃도어" 또는 breadcrumb 마지막 항목
    const last = breadcrumb[breadcrumb.length - 1];
    return last || "아웃도어";
  }

  private parsePrice(text: string | undefined | null): number {
    if (!text) return 0;
    const num = parseInt(String(text).replace(/[^0-9]/g, ""), 10);
    return isNaN(num) || num < 1000 ? 0 : num;
  }
}
