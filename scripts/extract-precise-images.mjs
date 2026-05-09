// 정밀 product 이미지 추출.
// Shopify products.json API + 한국 자체 사이트의 product 페이지 selector.
//
// 사용: node scripts/extract-precise-images.mjs > precise.json

import * as cheerio from "cheerio";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const result = {};

async function fetchJson(url) {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function fetchHtml(url, referer) {
  const r = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html",
      "Accept-Language": "ko-KR,ko;q=0.9",
      ...(referer ? { Referer: referer } : {}),
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

// ─── Salomon (Shopify) ───
try {
  const data = await fetchJson("https://salomon.co.kr/products.json?limit=30");
  const imgs = (data.products || [])
    .map((p) => p.images?.[0]?.src)
    .filter(Boolean)
    .slice(0, 12);
  result.salomon = imgs;
  console.error(`[salomon] ${imgs.length} product images`);
} catch (e) {
  console.error("[salomon] FAIL:", e.message);
  result.salomon = [];
}

// ─── Wilson (Shopify) ───
try {
  const data = await fetchJson("https://kr.wilson.com/products.json?limit=30");
  const imgs = (data.products || [])
    .map((p) => p.images?.[0]?.src)
    .filter(Boolean)
    .slice(0, 12);
  result.wilson = imgs;
  console.error(`[wilson] ${imgs.length} product images`);
} catch (e) {
  console.error("[wilson] FAIL:", e.message);
  result.wilson = [];
}

// ─── TNF: 여러 카테고리 페이지 fetch + cmsstatic/product/* 패턴만 추출 ───
try {
  const urls = [
    "https://www.thenorthfacekorea.co.kr/category/n/men/jacket-vest",
    "https://www.thenorthfacekorea.co.kr/category/n/men/tops",
    "https://www.thenorthfacekorea.co.kr/category/n/women/jacket-vest",
    "https://www.thenorthfacekorea.co.kr/category/n/women/tops",
    "https://www.thenorthfacekorea.co.kr/category/n/men/bags",
  ];
  const collected = new Set();
  for (const u of urls) {
    try {
      const html = await fetchHtml(u, "https://www.thenorthfacekorea.co.kr/");
      const $ = cheerio.load(html);
      $("img").each((_, el) => {
        const src =
          $(el).attr("src") ||
          $(el).attr("data-src") ||
          $(el).attr("data-original");
        if (
          src &&
          /cmsstatic\/product\//i.test(src) &&
          /primary|_01|_02|_03/i.test(src)
        ) {
          collected.add(
            src.startsWith("//") ? "https:" + src : new URL(src, u).toString()
          );
        }
      });
    } catch (e) {
      console.error(`[tnf] ${u} FAIL:`, e.message);
    }
  }
  result.thenorthface = Array.from(collected).slice(0, 12);
  console.error(`[thenorthface] ${result.thenorthface.length} product images`);
} catch (e) {
  console.error("[tnf] FAIL:", e.message);
  result.thenorthface = [];
}

// ─── Kolon Sport: collection 페이지에서 images3.kolonmall.com 패턴만 ───
try {
  const urls = [
    "https://www.kolonsport.com/category/men/jacket",
    "https://www.kolonsport.com/category/women/jacket",
    "https://www.kolonsport.com/category/men/tops",
  ];
  const collected = new Set();
  for (const u of urls) {
    try {
      const html = await fetchHtml(u, "https://www.kolonsport.com/");
      const $ = cheerio.load(html);
      $("img").each((_, el) => {
        const src =
          $(el).attr("src") ||
          $(el).attr("data-src") ||
          $(el).attr("data-original");
        if (
          src &&
          /images\d?\.kolonmall\.com/i.test(src) &&
          !/noimage|footer|icon/i.test(src)
        ) {
          collected.add(
            src.startsWith("//") ? "https:" + src : new URL(src, u).toString()
          );
        }
      });
    } catch (e) {
      console.error(`[kolon] ${u} FAIL:`, e.message);
    }
  }
  result.kolonsport = Array.from(collected).slice(0, 12);
  console.error(`[kolonsport] ${result.kolonsport.length} product images`);
} catch (e) {
  console.error("[kolon] FAIL:", e.message);
  result.kolonsport = [];
}

// ─── Aloyoga: 글로벌 sitemap에서 product 이미지 추출 (sitemap은 200으로 접근 가능) ───
try {
  // sitemap.xml에서 sitemap_products_1.xml URL 추출
  const indexXml = await fetchHtml(
    "https://www.aloyoga.com/sitemap.xml",
    "https://www.aloyoga.com/"
  );
  const productSitemapMatch = indexXml.match(
    /https:\/\/www\.aloyoga\.com\/sitemap_products_1\.xml[^<]*/
  );
  if (!productSitemapMatch) throw new Error("product sitemap URL not found");
  const productSitemapUrl = productSitemapMatch[0].replace(/&amp;/g, "&");

  // product sitemap fetch
  const productXml = await fetchHtml(
    productSitemapUrl,
    "https://www.aloyoga.com/"
  );

  // <image:title>...</image:title>와 <image:loc>...</image:loc> 페어 추출
  // 우선 leggings/hoodie/sweatshirt/bra/short 등 키워드 포함된 product만
  const entries = [];
  const re =
    /<image:loc>([^<]+)<\/image:loc>\s*<image:title>([^<]+)<\/image:title>/g;
  let match;
  while ((match = re.exec(productXml)) !== null) {
    const [, loc, title] = match;
    if (
      /legging|hoodie|sweatshirt|bra|short|sweatpant|jacket|capri/i.test(title)
    ) {
      entries.push({ loc, title });
    }
    if (entries.length >= 30) break;
  }
  // 중복 image URL 제거 + 12개로 자름
  const seen = new Set();
  const unique = [];
  for (const e of entries) {
    if (seen.has(e.loc)) continue;
    seen.add(e.loc);
    unique.push(e.loc);
    if (unique.length >= 12) break;
  }
  result.aloyoga = unique;
  console.error(`[aloyoga] ${result.aloyoga.length} product images (sitemap)`);
} catch (e) {
  console.error("[aloyoga] FAIL:", e.message);
  result.aloyoga = [];
}

console.log(JSON.stringify(result, null, 2));
