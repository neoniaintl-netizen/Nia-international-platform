import * as cheerio from "cheerio";
import { BaseCrawler } from "./base-crawler";
import type { CrawledProduct } from "./types";

/**
 * 무신사 크롤러 (2026년 실제 구조 대응)
 *
 * 무신사는 Next.js SSR 기반으로 window.__MSS__ 전역 변수를
 * **점진적으로 빌드**합니다:
 *
 *   window.__MSS__ = window.__MSS__ || {};
 *   window.__MSS__.product = window.__MSS__.product || {};
 *   window.__MSS__.product.state = { ... 24KB JSON ... };
 *
 * 핵심 데이터 경로:
 *   - 상품명:    state.goodsNm
 *   - 브랜드:    state.brandInfo.brandName
 *   - 가격:      state.goodsPrice.normalPrice / salePrice
 *   - 이미지:    state.thumbnailImageUrl, state.goodsImages[]
 *   - 카테고리:  state.category.categoryDepth1~4Title
 *   - 옵션:      state.optionItems[] (있을 경우)
 *   - 설명:      state.goodsContents (HTML)
 *
 * 폴백: meta 태그 (og:title, product:brand, product:price:*)
 */
export class MusinsaCrawler extends BaseCrawler {
  readonly sourceSite = "musinsa";

  // ─────────────────────────────────────
  //  목록 페이지 파싱
  // ─────────────────────────────────────

  /** 목록 페이지에서 상품 URL 추출 */
  parseProductList(html: string): string[] {
    const $ = cheerio.load(html);
    const urls: string[] = [];

    // 1) /products/{숫자} 패턴 링크 추출
    $('a[href*="/products/"]').each((_, el) => {
      const href = $(el).attr("href");
      if (href) {
        const match = href.match(/\/products\/(\d+)/);
        if (match) {
          const fullUrl = `https://www.musinsa.com/products/${match[1]}`;
          if (!urls.includes(fullUrl)) urls.push(fullUrl);
        }
      }
    });

    // 2) 백업: "goodsNo" JSON 패턴에서 상품 ID 추출
    if (urls.length === 0) {
      const productIdPattern = /"goodsNo"\s*:\s*(\d+)/g;
      let m;
      while ((m = productIdPattern.exec(html)) !== null) {
        const fullUrl = `https://www.musinsa.com/products/${m[1]}`;
        if (!urls.includes(fullUrl)) urls.push(fullUrl);
      }
    }

    // 3) 백업: data-goods-no 속성
    if (urls.length === 0) {
      $("[data-goods-no]").each((_, el) => {
        const goodsNo = $(el).attr("data-goods-no");
        if (goodsNo) {
          const fullUrl = `https://www.musinsa.com/products/${goodsNo}`;
          if (!urls.includes(fullUrl)) urls.push(fullUrl);
        }
      });
    }

    return [...new Set(urls)];
  }

  // ─────────────────────────────────────
  //  상품 상세 파싱
  // ─────────────────────────────────────

  /** 상품 상세 페이지 파싱 – 3단계 폴백 */
  parseProductDetail(html: string, url: string): CrawledProduct | null {
    // ── 1) window.__MSS__.product.state JSON 추출 (가장 정확) ──
    const mssState = this.extractMSSProductState(html);
    if (mssState) {
      return this.parseFromMSSState(mssState, url);
    }

    // ── 2) __NEXT_DATA__ JSON 추출 (구조 변경 시 대비) ──
    const nextData = this.extractNextData(html);
    if (nextData) {
      const result = this.parseFromNextData(nextData, url);
      if (result) return result;
    }

    // ── 3) 폴백: meta 태그 (og:*, product:*) ──
    return this.parseFromMeta(html, url);
  }

  // ─────────────────────────────────────
  //  __MSS__.product.state 추출
  // ─────────────────────────────────────

  /**
   * window.__MSS__.product.state = { ... }; 에서 JSON 추출
   *
   * 24KB+ 중첩 JSON이라 regex [\s\S]*? 가 부정확할 수 있으므로
   * 브레이스 카운터로 정확한 JSON 범위를 잡는다.
   */
  private extractMSSProductState(html: string): any | null {
    try {
      const marker = "__MSS__.product.state";
      const markerIdx = html.indexOf(marker);
      if (markerIdx < 0) return null;

      // = 이후 { 찾기
      const afterMarker = html.indexOf("=", markerIdx);
      if (afterMarker < 0) return null;

      // { 시작 위치
      const jsonStart = html.indexOf("{", afterMarker);
      if (jsonStart < 0) return null;

      // 브레이스 카운터로 JSON 끝 찾기
      const jsonStr = this.extractJsonObject(html, jsonStart);
      if (!jsonStr) return null;

      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  }

  /**
   * 브레이스 카운터 – 중첩된 JSON 객체의 정확한 범위를 추출
   * 문자열 내부의 { } 를 무시하고 최외곽 괄호 매칭
   */
  private extractJsonObject(text: string, startIdx: number): string | null {
    if (text[startIdx] !== "{") return null;

    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = startIdx; i < text.length; i++) {
      const ch = text[i];

      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\" && inString) {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          return text.slice(startIdx, i + 1);
        }
      }
    }
    return null;
  }

  /** __NEXT_DATA__ 추출 */
  private extractNextData(html: string): any | null {
    try {
      const match = html.match(
        /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
      );
      if (match?.[1]) {
        return JSON.parse(match[1]);
      }
      return null;
    } catch {
      return null;
    }
  }

  // ─────────────────────────────────────
  //  파서: __MSS__.product.state
  // ─────────────────────────────────────

  /**
   * product.state 객체에서 상품 정보 추출
   *
   * 실제 키 구조 (2026.04 기준):
   *   goodsNm, brandInfo.brandName, goodsPrice.{normalPrice, salePrice},
   *   thumbnailImageUrl, goodsImages[], category.categoryDepth1~4Title,
   *   optionItems[], goodsContents (HTML)
   */
  private parseFromMSSState(
    state: any,
    url: string
  ): CrawledProduct | null {
    try {
      // 상품명
      const name = state.goodsNm || state.goodsName;
      if (!name) return null;

      // 브랜드
      const brandInfo = state.brandInfo || {};
      const brandName =
        brandInfo.brandName || brandInfo.brandEnglishName || "Unknown";

      // 가격 – state.goodsPrice.normalPrice / salePrice
      const goodsPrice = state.goodsPrice || {};
      const originalPrice =
        goodsPrice.normalPrice || goodsPrice.originPrice || 0;
      const salePrice =
        goodsPrice.salePrice || goodsPrice.minPrice || null;

      // 이미지
      const imageUrls: string[] = [];

      // 메인 썸네일
      if (state.thumbnailImageUrl) {
        imageUrls.push(this.normalizeImageUrl(state.thumbnailImageUrl));
      }

      // 추가 이미지 – goodsImages (복수형, 실제 키)
      const goodsImages = state.goodsImages || state.goodsImage;
      if (goodsImages) {
        const imgs = Array.isArray(goodsImages) ? goodsImages : [goodsImages];
        for (const img of imgs) {
          const imgUrl =
            typeof img === "string"
              ? img
              : img?.imageUrl || img?.url || img?.originUrl;
          if (imgUrl) imageUrls.push(this.normalizeImageUrl(imgUrl));
        }
      }

      // 카테고리 – 가장 세분화된 것 우선
      const category = state.category || {};
      const categoryName =
        category.categoryDepth4Title ||
        category.categoryDepth3Title ||
        category.categoryDepth2Title ||
        category.categoryDepth1Title ||
        "";

      // 설명 – goodsContents (HTML) → 태그 제거
      const rawDesc = state.mdOpinion || state.goodsContents || "";
      const description = rawDesc
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 500);

      // 옵션/사이즈 (의류 상품에만 존재)
      const variants: CrawledProduct["variants"] = [];
      if (state.optionItems && Array.isArray(state.optionItems)) {
        for (const opt of state.optionItems) {
          variants.push({
            size: opt.optionValue || opt.name || opt.label,
            stock: opt.remainCount ?? opt.stock ?? 100,
          });
        }
      }

      // 태그 – specialtyCodes, storeCodes 활용
      const tags: string[] = [];
      if (state.specialtyCodes && Array.isArray(state.specialtyCodes)) {
        tags.push(...state.specialtyCodes);
      }
      if (state.sex && Array.isArray(state.sex)) {
        tags.push(...state.sex);
      }

      return {
        name,
        brandName,
        categoryName: categoryName || undefined,
        originalPrice,
        salePrice:
          salePrice && salePrice < originalPrice ? salePrice : undefined,
        description: description || undefined,
        imageUrls: [...new Set(imageUrls)],
        sourceUrl: url,
        sourceSite: this.sourceSite,
        variants: variants.length > 0 ? variants : undefined,
        tags: tags.length > 0 ? tags : undefined,
      };
    } catch {
      return null;
    }
  }

  // ─────────────────────────────────────
  //  파서: __NEXT_DATA__ (미래 구조 변경 대비)
  // ─────────────────────────────────────

  private parseFromNextData(
    nextData: any,
    url: string
  ): CrawledProduct | null {
    try {
      const props = nextData?.props?.pageProps;
      if (!props) return null;

      // 다양한 경로 시도
      const product =
        props.product || props.goods || props.data?.product;
      if (!product) return null;

      const name = product.goodsNm || product.name || product.title;
      if (!name) return null;

      return {
        name,
        brandName: product.brandName || product.brand?.name || "Unknown",
        categoryName: product.categoryName || product.category?.name,
        originalPrice: product.normalPrice || product.price || 0,
        salePrice: product.salePrice || undefined,
        description: (product.description || "").slice(0, 500),
        imageUrls: product.imageUrl ? [product.imageUrl] : [],
        sourceUrl: url,
        sourceSite: this.sourceSite,
      };
    } catch {
      return null;
    }
  }

  // ─────────────────────────────────────
  //  파서: meta 태그 폴백
  // ─────────────────────────────────────

  /**
   * meta 태그 폴백 파싱
   *
   * 무신사 실제 meta 구조 (2026.04 기준):
   *   og:title       → "브랜드(EN) 상품명 - 후기 | 무신사"
   *   og:image       → 상품 이미지 URL
   *   og:description → "제품분류 :카테고리 브랜드 : 브랜드명 ..."
   *   product:brand  → 브랜드 한글명
   *   product:price:amount       → 할인가 (판매가)
   *   product:price:normal_price → 정가 (원가)
   *   product:price:sale_rate    → 할인율 (%)
   */
  private parseFromMeta(html: string, url: string): CrawledProduct | null {
    const $ = cheerio.load(html);

    const name =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text().trim();
    if (!name) return null;

    const brandName =
      $('meta[property="product:brand"]').attr("content") || "Unknown";

    // 무신사는 product:price:amount = 할인가, product:price:normal_price = 정가
    const priceAmount = this.parsePrice(
      $('meta[property="product:price:amount"]').attr("content")
    );
    const normalPrice = this.parsePrice(
      $('meta[property="product:price:normal_price"]').attr("content")
    );

    // normal_price가 있으면 정가로, 없으면 amount를 정가로
    const originalPrice = normalPrice || priceAmount || 0;
    const salePrice = normalPrice && priceAmount && priceAmount < normalPrice
      ? priceAmount
      : undefined;

    const imageUrls: string[] = [];
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) imageUrls.push(this.normalizeImageUrl(ogImage));

    const description =
      $('meta[property="og:description"]').attr("content") || "";

    const categoryName =
      $('meta[property="product:category"]').attr("content") || "";

    return {
      name: name
        .replace(/ - 후기 \| 무신사$/, "")
        .replace(/ \| 무신사$/, "")
        .trim(),
      brandName,
      categoryName: categoryName || undefined,
      originalPrice,
      salePrice,
      description: description || undefined,
      imageUrls,
      sourceUrl: url,
      sourceSite: this.sourceSite,
    };
  }

  // ─────────────────────────────────────
  //  유틸리티
  // ─────────────────────────────────────

  /** 이미지 URL 정규화 */
  private normalizeImageUrl(url: string): string {
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("/")) return `https://image.musinsa.com${url}`;
    return url;
  }

  /** 가격 문자열 → 숫자 */
  private parsePrice(text: string | undefined): number {
    if (!text) return 0;
    const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
    return isNaN(num) ? 0 : num;
  }
}
