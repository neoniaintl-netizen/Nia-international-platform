// JSON-LD Product 추출 공용 헬퍼 (cafe24 / generic 어댑터 공유).
import type { CheerioAPI } from "cheerio";

type Offer = { price?: string | number; lowPrice?: string | number };

export interface LdProduct {
  name?: string;
  offers?: Offer | Offer[];
  image?: string | string[] | { url?: string }[];
  /** ProductGroup은 top-level offers 없이 변형별 offers를 가짐 */
  hasVariant?: Array<{ offers?: Offer | Offer[] }>;
}

// Product / ProductGroup 둘 다 상품으로 취급.
function isProductType(t: unknown): boolean {
  return t === "Product" || t === "ProductGroup" || (Array.isArray(t) && t.some((x) => x === "Product" || x === "ProductGroup"));
}

/** HTML의 script[type=application/ld+json]에서 Product/ProductGroup 노드 추출 (@graph·배열 지원). */
export function findLdProduct($: CheerioAPI): LdProduct | null {
  let found: LdProduct | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const d = JSON.parse($(el).text() || "{}") as Record<string, unknown>;
      const graph = d["@graph"];
      const prod = isProductType(d["@type"])
        ? d
        : Array.isArray(graph)
          ? graph.find((x) => isProductType((x as Record<string, unknown>)["@type"]))
          : Array.isArray(d)
            ? (d as Record<string, unknown>[]).find((x) => isProductType(x["@type"]))
            : null;
      if (prod) {
        found = prod as LdProduct;
        return false;
      }
    } catch {
      /* skip malformed ld+json */
    }
  });
  return found;
}

function offerPrice(offers: Offer | Offer[] | undefined): number {
  const o = Array.isArray(offers) ? offers[0] : offers;
  const raw = o?.price ?? o?.lowPrice;
  return raw ? Math.round(parseFloat(String(raw))) : 0;
}

/** 대표 가격(정수 원). top-level offers → 없으면 hasVariant[0].offers(ProductGroup). */
export function ldPrice(ld: LdProduct | null): number {
  return offerPrice(ld?.offers) || offerPrice(ld?.hasVariant?.[0]?.offers) || 0;
}

/** LdProduct.image를 URL 배열로 정규화. */
export function ldImages(ld: LdProduct | null): string[] {
  if (!ld?.image) return [];
  const arr = Array.isArray(ld.image) ? ld.image : [ld.image];
  return arr
    .map((i) => (typeof i === "string" ? i : i?.url ?? ""))
    .filter(Boolean)
    .map((u) => (u.startsWith("//") ? `https:${u}` : u));
}
