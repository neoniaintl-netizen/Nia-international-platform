import assert from "node:assert";
import { test } from "../harness";
import { validateSiteConfig, type SiteConfig } from "../types";

test("strategy 누락 → throw", () => {
  assert.throws(() =>
    validateSiteConfig({
      id: "x",
      name: "X",
      baseUrl: "https://x.com",
      brandName: "X",
      platform: "cafe24",
    } as SiteConfig),
  );
});

test("정상 config 통과", () => {
  const c = validateSiteConfig({
    id: "x",
    name: "X",
    baseUrl: "https://x.com",
    brandName: "X",
    platform: "cafe24",
    strategy: "static_html",
  });
  assert.equal(c.id, "x");
});
