// Playwright 어댑터 (tier-3) — JS 렌더 사이트용. 로컬/Actions 전용, Railway 프로덕션 실행 금지.
// listEndpoint(들) 렌더 → productUrlPattern 으로 상세 URL 추출 → 상세 렌더 → GenericAdapter 파서 재사용.
import type { CrawledProduct } from "../types";
import type { SiteConfig } from "../engine/types";
import { type Adapter, randomDelay } from "../engine/base-crawler";
import { parseGenericDetail, extractGenericUrls } from "./generic";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export class PlaywrightAdapter implements Adapter {
  readonly platform = "playwright";

  async collect(cfg: SiteConfig, opts: { limit: number }): Promise<CrawledProduct[]> {
    if (!cfg.listEndpoint) throw new Error(`playwright(${cfg.id}) listEndpoint 필요`);
    // 변수 specifier 로 동적 import → next build 가 playwright 를 번들하지 않음(devDep, CLI 전용)
    const pkg = "playwright";
    const { chromium } = (await import(pkg)) as unknown as {
      chromium: { launch: (o: unknown) => Promise<PwBrowser> };
    };
    const browser = await chromium.launch({ headless: true });
    try {
      const render = async (url: string, waitMs: number): Promise<string> => {
        const page = await browser.newPage({ userAgent: UA });
        try {
          await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
          await page.waitForTimeout(waitMs);
          return await page.content();
        } finally {
          await page.close();
        }
      };

      // 1) 리스트 렌더(쉼표 구분 다중 진입점 지원) → 상세 URL 수집
      const endpoints = cfg.listEndpoint.split(",").map((s) => s.trim()).filter(Boolean);
      const urls = new Set<string>();
      for (const ep of endpoints) {
        try {
          const listHtml = await render(ep, 4500);
          for (const u of extractGenericUrls(listHtml, cfg)) urls.add(u);
        } catch {
          /* 진입점 렌더 실패는 건너뜀 */
        }
        if (urls.size >= opts.limit) break;
      }

      // 2) 상세 렌더 → 파싱
      const out: CrawledProduct[] = [];
      for (const url of [...urls].slice(0, opts.limit)) {
        try {
          const html = await render(url, 3500);
          const p = parseGenericDetail(html, url, cfg);
          if (p && p.originalPrice > 0) out.push(p);
        } catch {
          /* 개별 상품 실패는 건너뜀 */
        }
        await randomDelay();
      }
      return out;
    } finally {
      await browser.close();
    }
  }
}

interface PwBrowser {
  newPage: (o: unknown) => Promise<PwPage>;
  close: () => Promise<void>;
}
interface PwPage {
  goto: (url: string, o: unknown) => Promise<unknown>;
  waitForTimeout: (ms: number) => Promise<void>;
  content: () => Promise<string>;
  close: () => Promise<void>;
}
