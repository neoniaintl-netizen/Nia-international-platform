/**
 * brand 사이트에서 product 이미지를 type별로 추출.
 *
 * 전략:
 * 1. Shopify 기반 brand (markandlona): sitemap_products_1.xml에서
 *    image:loc + image:title 추출 후 title을 type bucket
 * 2. cafe24 기반 brand (utaa, pelt, anew, iceberg, southcape, thecart):
 *    sitemap.xml에서 /product/ URL 추출, URL slug의 카테고리 키워드로
 *    type bucket. 각 product 페이지를 Playwright로 fetch해서 og:image 추출
 * 3. 자체 SPA (patagonia, arcteryx, descente): Playwright로 collection 페이지
 *    JS 렌더링 후 product card 추출
 *
 * 사용:
 *   node scripts/extract-with-playwright.mjs > /tmp/playwright.json
 */

import { chromium } from "playwright";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

function bucketByText(text) {
  const t = text.toLowerCase();
  if (/cap|hat|visor|beanie|bucket|sun-?visor|모자|캡|비니|버킷/i.test(t))
    return "HEADWEAR";
  if (/sneaker|shoes|kiltie|derby|stride|loafer|spike|cleat|슈즈|운동화|스니커즈/i.test(t))
    return "SHOES";
  if (
    /polo|shirt|tee|t-?shirt|knit|sweater|sweatshirt|crop|cardigan|tank|jersey|baselayer|hood(ie)?|sleeve|블라우스|셔츠|티셔츠|폴로|후드|니트|크롭|롱슬리브|반팔|긴팔/i.test(t)
  )
    return "APPAREL_TOP";
  if (
    /pant|jean|denim|chino|cargo|short(?!-?sleeve)|jogger|legging|skirt|kilt|trouser|팬츠|바지|반바지|레깅스|스커트|치마/i.test(t)
  )
    return "APPAREL_BOTTOM";
  if (
    /jacket|coat|parka|windbreaker|jumper|anorak|fleece|down|outer|vest|gilet|자켓|재킷|코트|패딩|점퍼|아노락|플리스|베스트/i.test(t)
  )
    return "APPAREL_OUTER";
  if (/dress|gown|jumpsuit|romper|원피스|드레스/i.test(t)) return "APPAREL_DRESS";
  if (/caddybag|caddy-?bag|cart-?bag|stand-?bag|tour-?bag|골프백|캐디백/i.test(t))
    return "GOLF_BAG";
  if (/backpack|tote|crossbody|sling|duffle|messenger|handbag|가방|백팩|토트/i.test(t))
    return "BAG";
  if (/driver|wedge|putter|iron|hybrid|fairway|club|드라이버|아이언|웨지|퍼터/i.test(t))
    return "GOLF_EQUIPMENT";
  if (/sock|belt|glove|watch|necklace|bracelet|marker|벨트|장갑|양말|마커/i.test(t))
    return "ACCESSORY";
  if (/bra|seamless|underwear|브라|언더웨어/i.test(t)) return "UNDERWEAR";
  return "UNKNOWN";
}

async function fetchText(url, signal) {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9" },
    signal: signal ?? AbortSignal.timeout(15_000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

/**
 * Shopify brand: sitemap_products에서 image:loc + image:title 추출
 */
async function extractShopify(brandSlug, mainSitemapUrl) {
  const result = { slug: brandSlug, byType: {}, errors: [] };
  try {
    const indexXml = await fetchText(mainSitemapUrl);
    const m = indexXml.match(
      /https:\/\/[^/]+\/sitemap_products_1\.xml[^<]*/
    );
    if (!m) throw new Error("sitemap_products_1.xml not found in index");
    const productsUrl = m[0].replace(/&amp;/g, "&");
    const xml = await fetchText(productsUrl);
    const re =
      /<image:loc>([^<]+)<\/image:loc>\s*<image:title>([^<]+)<\/image:title>/g;
    let match;
    while ((match = re.exec(xml)) !== null) {
      const [, loc, titleRaw] = match;
      const title = titleRaw.replace(/&apos;/g, "'").replace(/&amp;/g, "&");
      const type = bucketByText(title);
      if (type === "UNKNOWN") continue;
      if (!result.byType[type]) result.byType[type] = [];
      if (!result.byType[type].includes(loc)) result.byType[type].push(loc);
    }
    // type별 8개로 자름
    for (const t of Object.keys(result.byType))
      result.byType[t] = result.byType[t].slice(0, 8);
  } catch (e) {
    result.errors.push(e.message ?? String(e));
  }
  return result;
}

/**
 * cafe24 brand: sitemap.xml의 /product/ URL slug에서 카테고리 추출 + 각 페이지 og:image 가져오기
 */
async function extractCafe24(browser, brandSlug, sitemapUrl, maxPerType = 6) {
  const result = { slug: brandSlug, byType: {}, errors: [] };
  try {
    const xml = await fetchText(sitemapUrl);
    const productUrls = Array.from(
      xml.matchAll(/<loc>([^<]*\/product\/[^<]+)<\/loc>/g)
    ).map((m) => m[1]);

    // URL slug → type 분류, type별 소수만 fetch
    const wanted = {};
    for (const url of productUrls) {
      const slugMatch = url.match(/\/product\/([^/]+)/);
      if (!slugMatch) continue;
      const slug = slugMatch[1];
      const type = bucketByText(slug);
      if (type === "UNKNOWN") continue;
      if (!wanted[type]) wanted[type] = [];
      if (wanted[type].length < maxPerType) wanted[type].push({ url, slug });
    }

    const ctx = await browser.newContext({
      userAgent: UA,
      viewport: { width: 1280, height: 900 },
    });
    const page = await ctx.newPage();

    for (const type of Object.keys(wanted)) {
      result.byType[type] = [];
      for (const { url } of wanted[type]) {
        try {
          await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 15_000,
          });
          const ogImage = await page
            .locator('meta[property="og:image"]')
            .first()
            .getAttribute("content");
          if (ogImage && !/placehold\.co|noimage|icon|sprite|svg/i.test(ogImage)) {
            const abs = ogImage.startsWith("//") ? "https:" + ogImage : ogImage;
            if (!result.byType[type].includes(abs))
              result.byType[type].push(abs);
          }
        } catch (e) {
          result.errors.push(
            `${url.slice(-40)}: ${e.message?.slice(0, 60) ?? "fail"}`
          );
        }
      }
    }
    await ctx.close();
  } catch (e) {
    result.errors.push(e.message ?? String(e));
  }
  return result;
}

const SHOPIFY_BRANDS = [
  ["markandlona", "https://markandlona-korea.co.kr/sitemap.xml"],
];

const CAFE24_BRANDS = [
  ["utaa", "https://utaagolf.com/sitemap.xml"],
  ["anew", "https://anewgolf.com/sitemap.xml"],
  ["southcape", "https://southcape.shop/sitemap.xml"],
];

(async () => {
  const out = {};

  // 1. Shopify
  for (const [slug, url] of SHOPIFY_BRANDS) {
    process.stderr.write(`[shopify:${slug}] sitemap ${url} ... `);
    const r = await extractShopify(slug, url);
    const total = Object.values(r.byType).reduce((s, a) => s + a.length, 0);
    process.stderr.write(
      `${total} images (${Object.entries(r.byType).map(([k, v]) => `${k}:${v.length}`).join(",") || "none"})\n`
    );
    out[slug] = r.byType;
  }

  // 2. cafe24
  const browser = await chromium.launch({ headless: true });
  for (const [slug, url] of CAFE24_BRANDS) {
    process.stderr.write(`[cafe24:${slug}] sitemap ${url} ... `);
    const r = await extractCafe24(browser, slug, url, 6);
    const total = Object.values(r.byType).reduce((s, a) => s + a.length, 0);
    process.stderr.write(
      `${total} images (${Object.entries(r.byType).map(([k, v]) => `${k}:${v.length}`).join(",") || "none"})${
        r.errors.length ? ` errors:${r.errors.length}` : ""
      }\n`
    );
    out[slug] = r.byType;
  }
  await browser.close();

  console.log(JSON.stringify(out, null, 2));
})();
