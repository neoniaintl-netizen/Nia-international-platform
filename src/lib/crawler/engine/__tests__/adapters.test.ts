// 파일럿 어댑터 파싱 테스트 — Phase 1이 캡처한 실제 fixture 대상. 셀렉터 추측 아님.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { test } from "../harness";
import { parseShopifyProduct } from "../../adapters/shopify";
import { parseCafe24Detail, extractProductUrls } from "../../adapters/cafe24";
import { parseGodomallDetail, extractGoodsUrls } from "../../adapters/godomall";
import { parseGenericDetail } from "../../adapters/generic";
import type { SiteConfig } from "../types";

const FIX = path.resolve(process.cwd(), "docs/crawler-fixtures");
const read = (p: string) => fs.readFileSync(path.join(FIX, p), "utf8");

test("shopify(markandlona) products.json 파싱", () => {
  const json = JSON.parse(read("markandlona/products.json"));
  const cfg = { id: "markandlona", baseUrl: "https://markandlona-korea.co.kr", brandName: "MARK & LONA" } as SiteConfig;
  const p = parseShopifyProduct(json.products[0], cfg);
  assert.ok(p.name.length > 0, "name");
  assert.equal(p.originalPrice, 558000);
  assert.equal(p.brandName, "MARK & LONA");
  assert.ok(p.imageUrls.length >= 1, "images");
  assert.equal(p.externalProductId, String(json.products[0].id));
});

test("cafe24(anewgolf) 상세 파싱", () => {
  const html = read("anewgolf/detail-1.html");
  const cfg = { id: "anewgolf", baseUrl: "https://anewgolf.com", brandName: "어뉴골프" } as SiteConfig;
  const p = parseCafe24Detail(html, "https://anewgolf.com/product/w-rain-jkbk/1967/", cfg);
  assert.ok(p, "product");
  assert.equal(p!.originalPrice, 658000);
  assert.ok(p!.name.length > 0, "name");
  assert.ok(p!.imageUrls.length >= 1, "images");
  assert.equal(p!.externalProductId, "1967");
});

test("godomall(southcape) 상세 파싱", () => {
  const html = read("southcape/detail-1.html");
  const cfg = { id: "southcape", baseUrl: "https://southcape.shop", brandName: "사우스케이프" } as SiteConfig;
  const p = parseGodomallDetail(html, "https://southcape.shop/goods/goods_view.php?goodsNo=1000008193", cfg);
  assert.ok(p, "product");
  assert.equal(p!.originalPrice, 398000);
  assert.ok(p!.name.length > 0, "name");
  assert.ok(p!.imageUrls.length >= 1, "images");
  assert.equal(p!.externalProductId, "1000008193");
});

test("generic(amazingcre) JSON-LD 파싱", () => {
  const html = read("amazingcre/detail-1.html");
  const cfg = { id: "amazingcre", baseUrl: "https://shop.amazingcre.com", brandName: "어메이징크리" } as SiteConfig;
  const p = parseGenericDetail(html, "https://shop.amazingcre.com/shop_view/3704", cfg);
  assert.ok(p, "product");
  assert.equal(p!.originalPrice, 395000);
  assert.ok(p!.imageUrls.length >= 1, "images");
});

test("generic(descentegolf) JSON-LD 파싱", () => {
  const html = read("descentegolf/detail-1.html");
  const cfg = { id: "descentegolf", baseUrl: "https://dk-on.com", brandName: "데상트골프" } as SiteConfig;
  const p = parseGenericDetail(html, "https://dk-on.com/DESCENTEGOLF/product/DR22MFBG42", cfg);
  assert.ok(p, "product");
  assert.equal(p!.originalPrice, 94050);
  assert.ok(p!.name.length > 0, "name");
});

test("generic(pxg) og:title + priceSelector 파싱", () => {
  const html = read("pxg/detail-1.html");
  const cfg = {
    id: "pxg",
    baseUrl: "https://www.pxg.co.kr",
    brandName: "PXG",
    selectors: { priceSelector: "#ProductPriceSale" },
  } as unknown as SiteConfig;
  const p = parseGenericDetail(html, "https://www.pxg.co.kr/product/view.asp?pno=9874", cfg);
  assert.ok(p, "product");
  assert.equal(p!.originalPrice, 399000);
  assert.ok(p!.name.length > 0, "name");
});

test("generic(malbon) title + priceRegex(GA4) 파싱", () => {
  const html = read("malbon/detail-1.html");
  const cfg = {
    id: "malbon",
    baseUrl: "https://malbongolfkorea.com",
    brandName: "말본",
    selectors: { priceRegex: '"currency"\\s*:\\s*"KRW"\\s*,\\s*"value"\\s*:\\s*"?(\\d+)' },
  } as unknown as SiteConfig;
  const p = parseGenericDetail(html, "https://malbongolfkorea.com/shop/detail.php?pno=ABC", cfg);
  assert.ok(p, "product");
  assert.equal(p!.originalPrice, 279000);
  assert.ok(p!.name.length > 0, "name");
});

test("playwright(titleist) 렌더HTML 파싱 (name/price selector)", () => {
  const html = read("titleist/detail-1.html");
  const cfg = {
    id: "titleist",
    baseUrl: "https://titleistapparel.co.kr",
    brandName: "타이틀리스트",
    selectors: { nameSelector: ".item-name", priceSelector: "[class*=price]" },
  } as unknown as SiteConfig;
  const p = parseGenericDetail(html, "https://titleistapparel.co.kr/product/TNPMS2221", cfg);
  assert.ok(p, "product");
  assert.equal(p!.name, "KOREA POLO SHIRT");
  assert.equal(p!.originalPrice, 258000);
});

test("cafe24 sitemap 상품 URL 추출", () => {
  const urls = extractProductUrls(read("anewgolf/sitemap.xml"), "https://anewgolf.com");
  assert.ok(urls.length > 5, `urls=${urls.length}`);
  assert.ok(urls.every((u) => u.includes("/product/")));
});

test("godomall 리스트 goodsNo URL 추출", () => {
  // southcape 리스트는 fixture 미저장 → 상세 HTML에도 관련상품 goods_view 링크가 있어 추출 로직만 검증
  const urls = extractGoodsUrls(read("southcape/detail-1.html"), "https://southcape.shop");
  assert.ok(urls.every((u) => u.includes("goods_view.php?goodsNo=")));
});
