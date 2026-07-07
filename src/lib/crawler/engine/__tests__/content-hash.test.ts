import assert from "node:assert";
import { test } from "../harness";
import { contentHash } from "../content-hash";

test("동일 입력 → 동일 해시 (옵션 순서 무관)", () => {
  const a = contentHash({ originalPrice: 100, salePrice: 90, soldOut: false, options: ["S", "M"] });
  const b = contentHash({ originalPrice: 100, salePrice: 90, soldOut: false, options: ["M", "S"] });
  assert.equal(a, b);
});

test("가격 변경 → 다른 해시", () => {
  const a = contentHash({ originalPrice: 100, salePrice: 90, soldOut: false, options: [] });
  const b = contentHash({ originalPrice: 100, salePrice: 80, soldOut: false, options: [] });
  assert.notEqual(a, b);
});

test("품절 변경 → 다른 해시", () => {
  const a = contentHash({ originalPrice: 100, soldOut: false, options: [] });
  const b = contentHash({ originalPrice: 100, soldOut: true, options: [] });
  assert.notEqual(a, b);
});
