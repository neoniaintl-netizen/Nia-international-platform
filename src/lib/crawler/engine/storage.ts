// 저장 래퍼 — 수집 결과를 기존 product-importer로 DRAFT 저장.
// content_hash/sourceProductId는 순수 계산까지만(컬럼 저장은 마이그레이션 적용 후 별도 배선).
import type { CrawledProduct } from "../types";
import { contentHash } from "./content-hash";
import { importCrawledProducts } from "../product-importer";

export function buildStorageFields(p: CrawledProduct): { sourceProductId: string | null; contentHash: string } {
  return {
    sourceProductId: p.externalProductId ?? null,
    contentHash: contentHash({
      originalPrice: p.originalPrice,
      salePrice: p.salePrice ?? null,
      soldOut: false,
      options: (p.variants ?? []).map((v) => `${v.size ?? ""}/${v.color ?? ""}`),
    }),
  };
}

/** 수집 상품을 DRAFT로 저장. 기존 importer 재사용(브랜드/카테고리/이미지/변형/DRAFT). */
export async function persist(products: CrawledProduct[], jobId: string) {
  return importCrawledProducts(products, jobId, { initialStatus: "DRAFT" });
}
