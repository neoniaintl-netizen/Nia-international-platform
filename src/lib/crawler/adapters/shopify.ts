// Shopify 어댑터 — tier-1 json_api. /products.json 페이지네이션으로 수집.
// 필드 위치는 markandlona/products.json fixture로 검증.
import type { CrawledProduct } from "../types";
import type { SiteConfig } from "../engine/types";
import { type Adapter, fetchJson, randomDelay } from "../engine/base-crawler";

interface ShopifyVariant {
  price: string;
  compare_at_price: string | null;
  available: boolean;
  title: string;
  sku: string;
}
interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: { src: string }[];
  options: { name: string; values: string[] }[];
}

/** products.json 상품 1건 → CrawledProduct. (순수 함수 — fixture 테스트 대상) */
export function parseShopifyProduct(p: ShopifyProduct, cfg: SiteConfig): CrawledProduct {
  const v0 = p.variants?.[0];
  const price = Math.round(parseFloat(v0?.price ?? "0"));
  const compare = v0?.compare_at_price ? Math.round(parseFloat(v0.compare_at_price)) : 0;
  const originalPrice = compare > price ? compare : price;
  const salePrice = compare > price ? price : undefined;
  return {
    name: p.title,
    brandName: cfg.brandName,
    originalPrice,
    salePrice,
    description: p.body_html ? p.body_html.slice(0, 2000) : undefined,
    imageUrls: (p.images ?? []).map((i) => i.src).filter(Boolean),
    sourceUrl: `${cfg.baseUrl.replace(/\/$/, "")}/products/${p.handle}`,
    sourceSite: cfg.id,
    externalProductId: String(p.id),
    variants: (p.variants ?? []).map((v) => ({ size: v.title, stock: v.available ? 100 : 0 })),
    tags: p.tags,
  };
}

export class ShopifyAdapter implements Adapter {
  readonly platform = "shopify";
  async collect(cfg: SiteConfig, opts: { limit: number }): Promise<CrawledProduct[]> {
    const out: CrawledProduct[] = [];
    const base = cfg.baseUrl.replace(/\/$/, "");
    for (let page = 1; out.length < opts.limit && page <= 20; page++) {
      const data = await fetchJson<{ products: ShopifyProduct[] }>(
        `${base}/products.json?limit=250&page=${page}`,
      );
      if (!data.products?.length) break;
      for (const p of data.products) {
        out.push(parseShopifyProduct(p, cfg));
        if (out.length >= opts.limit) break;
      }
      await randomDelay();
    }
    return out.slice(0, opts.limit);
  }
}
