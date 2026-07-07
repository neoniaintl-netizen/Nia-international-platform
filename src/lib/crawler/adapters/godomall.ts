// 고도몰 어댑터 — static_html. 리스트→goodsNo→상세.
// 가격은 hidden input(#set_goods_fixedPrice, #set_dc_price), 이름/이미지는 og. southcape fixture로 검증.
import * as cheerio from "cheerio";
import type { CrawledProduct } from "../types";
import type { SiteConfig } from "../engine/types";
import { type Adapter, fetchHtml, randomDelay } from "../engine/base-crawler";

function abs(src: string): string {
  return src.startsWith("//") ? `https:${src}` : src;
}

/** 고도몰 상세 HTML → CrawledProduct. (순수 함수 — fixture 테스트 대상) */
export function parseGodomallDetail(html: string, url: string, cfg: SiteConfig): CrawledProduct | null {
  const $ = cheerio.load(html);
  const name = String($('meta[property="og:title"]').attr("content") || $("title").text() || "")
    .replace(/\s*[|\-–].*$/, "")
    .trim();
  if (!name) return null;

  const fixed = parseFloat($("#set_goods_fixedPrice").attr("value") || "0");
  const dc = parseFloat($("#set_dc_price").attr("value") || "0");
  const originalPrice = Math.round(fixed);
  const salePrice = dc > 0 && dc < fixed ? Math.round(dc) : undefined;

  const images: string[] = [];
  const og = $('meta[property="og:image"]').attr("content");
  if (og) images.push(abs(og));
  $(".item_photo_slide img, .slider_wrap img, .viewImgWrap img").each((_, el) => {
    const s = $(el).attr("src") || $(el).attr("data-src");
    if (s) images.push(abs(s));
  });

  return {
    name,
    brandName: cfg.brandName,
    originalPrice,
    salePrice,
    imageUrls: [...new Set(images)].filter((u) => /^https?:\/\//.test(u)),
    sourceUrl: url,
    sourceSite: cfg.id,
    externalProductId: url.match(/goodsNo=(\d+)/)?.[1],
  };
}

/** 리스트 페이지 HTML에서 goods_view.php?goodsNo= 상세 URL 추출. */
export function extractGoodsUrls(listHtml: string, baseUrl: string): string[] {
  const base = baseUrl.replace(/\/$/, "");
  const nos = [...new Set((listHtml.match(/goods_view\.php\?goodsNo=\d+/g) ?? []))];
  return nos.map((rel) => `${base}/goods/${rel}`);
}

export class GodomallAdapter implements Adapter {
  readonly platform = "godomall";
  async collect(cfg: SiteConfig, opts: { limit: number }): Promise<CrawledProduct[]> {
    if (!cfg.listEndpoint) throw new Error(`godomall(${cfg.id}) listEndpoint 필요`);
    const listHtml = await fetchHtml(cfg.listEndpoint);
    const urls = extractGoodsUrls(listHtml, cfg.baseUrl).slice(0, opts.limit);
    const out: CrawledProduct[] = [];
    for (const url of urls) {
      try {
        const html = await fetchHtml(url);
        const p = parseGodomallDetail(html, url, cfg);
        if (p && p.originalPrice > 0) out.push(p);
      } catch {
        /* 개별 상품 실패는 건너뜀 */
      }
      await randomDelay();
    }
    return out;
  }
}
