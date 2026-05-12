import { chromium } from "playwright";
import { BaseCrawler } from "./base-crawler";
import type { CrawlConfig, CrawlResult, CrawledProduct } from "./types";

/**
 * Arc'teryx 한국 (arcteryx.co.kr) — Next.js SPA.
 * 전략:
 *  1. Playwright 로 category page 열어 product URL (`/products/view/[id]`) 추출
 *  2. 각 product page 는 fetch (SSR된 JSON-LD `<script type="application/ld+json">` 포함)
 *  3. JSON-LD 의 schema.org/Product 에서 name / image / description / sku / brand / price 일괄 추출
 */
export class ArcteryxCrawler extends BaseCrawler {
  readonly sourceSite = "arcteryx";

  parseProductList(_html: string): string[] {
    // category page 가 SPA 라 fetch HTML 만으로는 추출 불가. crawl() 에서 Playwright 사용
    return [];
  }

  parseProductDetail(html: string, url: string): CrawledProduct | null {
    const ldMatch = html.match(
      /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/,
    );
    if (!ldMatch) return null;
    let ld: any;
    try {
      ld = JSON.parse(ldMatch[1]);
    } catch {
      return null;
    }
    if (ld["@type"] !== "Product") return null;

    const name = String(ld.name || "").trim();
    const price = parseInt(String(ld.offers?.price || "0"), 10);
    const images = Array.isArray(ld.image)
      ? ld.image
      : ld.image
        ? [ld.image]
        : [];
    const description = String(ld.description || "").trim();
    const sku = String(ld.sku || "").trim();
    const availability = String(ld.offers?.availability || "");
    const isInStock = availability.includes("InStock");

    if (!name || price <= 0 || images.length === 0) return null;

    return {
      name,
      brandName: "Arc'teryx",
      originalPrice: price,
      imageUrls: images.slice(0, 5),
      description,
      sourceUrl: url,
      sourceSite: "arcteryx",
      tags: [
        ...(sku ? [`sku:${sku}`] : []),
        ...(isInStock ? [] : ["status:soldout"]),
      ],
    };
  }

  async crawl(config: CrawlConfig): Promise<CrawlResult> {
    const products: CrawledProduct[] = [];
    const errors: string[] = [];
    let totalItems = 0;
    let failedItems = 0;
    const maxItems = config.maxItems ?? 15;
    const delayMs = config.delayMs ?? 800;

    // 1) Playwright로 category page 에서 product URL 추출
    const browser = await chromium.launch({ headless: true });
    let productUrls: string[] = [];
    try {
      const page = await browser.newPage({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport: { width: 1440, height: 900 },
      });
      await page.goto(config.targetUrl, {
        waitUntil: "networkidle",
        timeout: 30000,
      });
      await page.waitForTimeout(3000);
      productUrls = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a"))
          .map((a) => (a as HTMLAnchorElement).href)
          .filter((h) => /\/products\/view\/\d+$/.test(h))
          .filter((h, i, arr) => arr.indexOf(h) === i);
      });
    } catch (e: any) {
      errors.push(`category page failed: ${e.message}`);
      await browser.close();
      return {
        success: false,
        totalItems: 0,
        successItems: 0,
        failedItems: 1,
        products: [],
        errors,
      };
    } finally {
      await browser.close();
    }

    totalItems = productUrls.length;
    const targetUrls = productUrls.slice(0, maxItems);

    // 2) 각 product page 는 fetch + JSON-LD 파싱
    for (const url of targetUrls) {
      try {
        const html = await this.fetchHtml(url);
        const product = this.parseProductDetail(html, url);
        if (product) {
          products.push(product);
        } else {
          failedItems++;
          errors.push(`Parse failed: ${url}`);
        }
        await this.delay(delayMs);
      } catch (e: any) {
        failedItems++;
        errors.push(`${url}: ${e.message}`);
      }
    }

    return {
      success: products.length > 0,
      totalItems,
      successItems: products.length,
      failedItems,
      products,
      errors,
    };
  }
}
