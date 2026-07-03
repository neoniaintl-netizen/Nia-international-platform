import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import type { CrawlConfig, CrawlResult, CrawledProduct, ICrawler } from "./types";
import { sanitizeProductHtml } from "./sanitize";

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
};

/** 크롤러 베이스 클래스 – 공통 HTTP / 재시도 / 딜레이 로직 */
export abstract class BaseCrawler implements ICrawler {
  abstract readonly sourceSite: string;

  // ── 서브클래스에서 구현 ──
  abstract parseProductList(html: string): string[];
  abstract parseProductDetail(html: string, url: string): CrawledProduct | null;

  /** HTML 페치 (재시도 포함) */
  protected async fetchHtml(
    url: string,
    headers?: Record<string, string>,
    retries = 3
  ): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, {
          headers: { ...DEFAULT_HEADERS, ...headers },
          signal: AbortSignal.timeout(15_000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
      } catch (err) {
        if (attempt === retries) throw err;
        await this.delay(1000 * attempt); // 점진적 대기
      }
    }
    throw new Error("fetch failed after retries");
  }

  /** 딜레이 */
  protected delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  /** 가격 문자열 → 숫자 */
  protected parsePrice(text: string | undefined): number {
    if (!text) return 0;
    const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
    return isNaN(num) ? 0 : num;
  }

  /**
   * 상품 이미지 통합 수집
   * - og:image
   * - itemprop=image
   * - 지정된 갤러리 selector들
   * - 상세 컨테이너 내부 <img>
   * - 중복 제거 + 절대경로화
   */
  protected collectImages(
    $: CheerioAPI,
    opts: {
      gallerySelectors?: string[];
      detailContainers?: string[];
      hostPatterns?: RegExp[];
      baseUrl?: string;
      minBytesHint?: number;
    } = {}
  ): string[] {
    const {
      gallerySelectors = [],
      detailContainers = [],
      hostPatterns,
      baseUrl,
    } = opts;
    const found = new Set<string>();

    const push = (raw: string | undefined) => {
      if (!raw) return;
      let src = raw.trim();
      if (src.startsWith("data:")) return;
      if (src.startsWith("//")) src = `https:${src}`;
      else if (src.startsWith("/") && baseUrl) {
        const b = baseUrl.replace(/\/$/, "");
        src = `${b}${src}`;
      }
      if (!/^https?:\/\//.test(src)) return;
      if (hostPatterns && hostPatterns.length) {
        if (!hostPatterns.some((r) => r.test(src))) return;
      }
      found.add(src);
    };

    const og = $('meta[property="og:image"]').attr("content");
    if (og) push(og);
    $('meta[property="og:image:secure_url"]').each((_, el) => push($(el).attr("content")));
    $('meta[itemprop="image"], [itemprop="image"]').each((_, el) => {
      push($(el).attr("content") || $(el).attr("src") || $(el).attr("href"));
    });

    const allGallerySelectors = [
      ...gallerySelectors,
      'img[itemprop="image"]',
      '[class*="gallery"] img',
      '[class*="thumb"] img',
      '[class*="swiper"] img',
      '[class*="slider"] img',
    ];
    for (const sel of allGallerySelectors) {
      $(sel).each((_, el) => {
        const $el = $(el);
        push(
          $el.attr("src") ||
            $el.attr("data-src") ||
            $el.attr("data-original") ||
            $el.attr("data-lazy") ||
            $el.attr("data-srcset")?.split(",")[0]?.trim().split(" ")[0]
        );
        const srcset = $el.attr("srcset");
        if (srcset) {
          srcset.split(",").forEach((part) => {
            const u = part.trim().split(" ")[0];
            if (u) push(u);
          });
        }
      });
    }

    for (const containerSel of detailContainers) {
      $(containerSel)
        .find("img")
        .each((_, el) => {
          const $el = $(el);
          push(
            $el.attr("src") ||
              $el.attr("data-src") ||
              $el.attr("data-original") ||
              $el.attr("data-lazy")
          );
        });
    }

    return Array.from(found)
      .filter((u) => !/icon|logo|sprite|blank|1x1|spacer/i.test(u))
      .filter((u) => !/\.svg(\?|$)/i.test(u));
  }

  /**
   * 상세 설명 HTML 추출 + sanitize.
   * 컨테이너 selector들 중 가장 긴 HTML을 반환.
   */
  protected extractDescriptionHtml(
    $: CheerioAPI,
    containers: string[]
  ): string | undefined {
    let best = "";
    for (const sel of containers) {
      $(sel).each((_, el) => {
        const html = $.html(el) || "";
        if (html.length > best.length) best = html;
      });
    }
    if (!best) return undefined;
    const cleaned = sanitizeProductHtml(best);
    return cleaned && cleaned.length > 40 ? cleaned : undefined;
  }

  /** HTML 문자열을 CheerioAPI로 로드 (shorthand) */
  protected load(html: string): CheerioAPI {
    return cheerio.load(html);
  }

  /** 메인 크롤 실행 */
  async crawl(config: CrawlConfig): Promise<CrawlResult> {
    const {
      targetUrl,
      maxItems = 50,
      delayMs = 500,
      headers,
    } = config;

    const products: CrawledProduct[] = [];
    const errors: string[] = [];

    try {
      // 1) 목록 페이지 가져오기
      const listHtml = await this.fetchHtml(targetUrl, headers);
      let productUrls = this.parseProductList(listHtml);
      productUrls = productUrls.slice(0, maxItems);

      // 2) 각 상품 상세 페이지 가져오기
      for (const url of productUrls) {
        try {
          await this.delay(delayMs);
          const detailHtml = await this.fetchHtml(url, headers);
          const product = this.parseProductDetail(detailHtml, url);
          if (product) {
            products.push(product);
          } else {
            errors.push(`파싱 실패: ${url}`);
          }
        } catch (err: any) {
          errors.push(`${url}: ${err.message}`);
        }
      }

      return {
        success: true,
        totalItems: productUrls.length,
        successItems: products.length,
        failedItems: errors.length,
        products,
        errors,
      };
    } catch (err: any) {
      return {
        success: false,
        totalItems: 0,
        successItems: 0,
        failedItems: 1,
        products: [],
        errors: [`목록 페이지 크롤링 실패: ${err.message}`],
      };
    }
  }
}
