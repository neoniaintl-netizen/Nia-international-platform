import type { CrawlConfig, CrawlResult, CrawledProduct, ICrawler } from "./types";

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
