import assert from "node:assert";
import { test } from "../harness";
import { buildStorageFields } from "../storage";
import type { CrawledProduct } from "../../types";

test("storage 필드 생성 (sourceProductId + contentHash)", () => {
  const p: CrawledProduct = {
    name: "P",
    brandName: "B",
    originalPrice: 100,
    salePrice: 90,
    imageUrls: [],
    sourceUrl: "https://x.com/product/1",
    sourceSite: "x",
    externalProductId: "1",
    variants: [{ size: "M" }],
  };
  const f = buildStorageFields(p);
  assert.equal(f.sourceProductId, "1");
  assert.ok(f.contentHash.length === 32);
});
