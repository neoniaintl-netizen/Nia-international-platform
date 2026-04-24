import * as cheerio from "cheerio";
import { BaseCrawler } from "./base-crawler";
import type { CrawledProduct } from "./types";

/**
 * Godomall5 크롤러 — 사우스케이프(southcape.shop) 등
 *
 * 리스팅: /goods/goods_list.php?cateCd={code}
 * 상세:   /goods/goods_view.php?goodsNo={id}
 */
export class GodomallCrawler extends BaseCrawler {
  readonly sourceSite = "godomall";

  parseProductList(html: string): string[] {
    const $ = cheerio.load(html);
    const urls = new Set<string>();
    const baseHost = this.extractBaseHost($);

    $('a[href*="goods_view.php"]').each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      const match = href.match(/goodsNo=(\d+)/);
      if (!match) return;
      const fullUrl = `${baseHost}/goods/goods_view.php?goodsNo=${match[1]}`;
      urls.add(fullUrl);
    });

    // fallback: HTML 원문에서 goodsNo 패턴 찾기
    if (urls.size === 0) {
      const matches = Array.from(html.matchAll(/goodsNo=(\d+)/g));
      for (const m of matches) {
        urls.add(`${baseHost}/goods/goods_view.php?goodsNo=${m[1]}`);
      }
    }

    return Array.from(urls);
  }

  parseProductDetail(html: string, url: string): CrawledProduct | null {
    const $ = cheerio.load(html);

    // og:title 또는 상품명 DOM 셀렉터
    let name =
      $('meta[property="og:title"]').attr("content") ||
      $(".item_detail_tit, .goods_name, .product-name").first().text().trim() ||
      $("h2, h3").first().text().trim();
    if (!name) return null;
    name = name.replace(/\s*[\|–\-—]\s*.*$/, "").trim();

    // 가격
    const price = this.extractPrice($);
    if (price.original === 0) return null;

    // 이미지 — BaseCrawler 공용 헬퍼
    const baseHost = this.extractBaseHost($);
    const imageUrls = this.collectImages($, {
      gallerySelectors: [
        ".item_photo_big img",
        ".item_photo_slide img",
        ".goods_thumbs img",
        ".goods-image img",
        "img[src*='/data/goods/']",
      ],
      detailContainers: [".goods_description", ".item_detail", "#detailArea", ".detail_explain"],
      baseUrl: baseHost,
    });
    if (imageUrls.length === 0) return null;

    const description = this.extractDescriptionHtml($, [
      ".goods_description",
      ".item_detail",
      "#detailArea",
      ".detail_explain",
    ]);

    const brand = this.inferBrandFromUrl(url);

    return {
      name,
      brandName: brand,
      originalPrice: price.original,
      salePrice: price.sale,
      imageUrls,
      description,
      sourceUrl: url,
      sourceSite: this.sourceSite,
    };
  }

  private extractBaseHost($: cheerio.CheerioAPI): string {
    const og = $('meta[property="og:url"]').attr("content");
    const canonical = $('link[rel="canonical"]').attr("href");
    const src = og || canonical;
    if (src) {
      try {
        const u = new URL(src);
        return `${u.protocol}//${u.host}`;
      } catch {}
    }
    return "https://southcape.shop";
  }

  private extractPrice($: cheerio.CheerioAPI): {
    original: number;
    sale?: number;
  } {
    const parseFirst = (selector: string): number => {
      const text = $(selector).first().text();
      if (!text) return 0;
      const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
      return isNaN(num) || num < 1000 ? 0 : num;
    };

    // Godomall5 기본 클래스: .item_detail_price, .consumer, .sale
    const consumer =
      parseFirst(".item_detail_price .consumer") ||
      parseFirst(".goods_consumer_price") ||
      parseFirst(".price_consumer");
    const sale =
      parseFirst(".item_detail_price .sale") ||
      parseFirst(".item_detail_price strong") ||
      parseFirst(".goods_price") ||
      parseFirst(".price_sale");

    const ogPrice = parseFirst('meta[property="product:price:amount"]');

    if (consumer > 0 && sale > 0 && sale < consumer) {
      return { original: consumer, sale };
    }
    const only = sale || consumer || ogPrice;
    return { original: only };
  }

  private extractImages($: cheerio.CheerioAPI, url: string): string[] {
    const imgs = new Set<string>();
    const ogImg = $('meta[property="og:image"]').attr("content");
    if (ogImg) imgs.add(this.resolveUrl(ogImg, url));

    // 상세 이미지 갤러리
    $(".goods_thumbs img, .item_photo_big img, .goods-image img, img[src*='/data/goods/']").each(
      (_, el) => {
        const src =
          $(el).attr("src") ||
          $(el).attr("data-src") ||
          $(el).attr("data-original");
        if (src) imgs.add(this.resolveUrl(src, url));
      }
    );

    return Array.from(imgs).filter((u) => !u.includes("btn_") && !u.includes("icon_")).slice(0, 6);
  }

  private resolveUrl(src: string, baseUrl: string): string {
    if (src.startsWith("http")) return src;
    if (src.startsWith("//")) return `https:${src}`;
    try {
      const u = new URL(baseUrl);
      if (src.startsWith("/")) return `${u.protocol}//${u.host}${src}`;
    } catch {}
    return src;
  }

  private inferBrandFromUrl(url: string): string {
    try {
      const host = new URL(url).hostname.toLowerCase();
      if (host.includes("southcape")) return "South Cape";
    } catch {}
    return "Unknown";
  }
}
