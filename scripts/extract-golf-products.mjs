/**
 * 22개 골프웨어 브랜드 product 추출.
 *
 * 출력: { [brandSlug]: { name, sourceUrl, imageUrl, type, price? }[] }
 *
 * 단계:
 * - A: Shopify products.json (markandlona, waacgolf)
 * - B: Shopify products.json with limit (thecart, gfore, southcape)
 * - C: sitemap.xml + og:image (amazingcre, pxg, anew, utaa, titleist)
 * - D: Playwright headless (bucketstore, malbon, langvan, descentegolf,
 *      bossgolf, iceberg, pelt, nikegolf)
 *
 * 실행: node scripts/extract-golf-products.mjs > /tmp/golf-products.json
 */

import { chromium } from "playwright";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

function bucketByText(text) {
  const t = text.toLowerCase();
  if (/cap|hat|visor|beanie|bucket|sun-?visor|모자|캡|비니|버킷|바이저/i.test(t))
    return "HEADWEAR";
  if (/sneaker|shoes|kiltie|derby|stride|loafer|spike|cleat|슈즈|운동화|스니커즈|골프화/i.test(t))
    return "SHOES";
  if (/dress|gown|jumpsuit|romper|원피스|드레스|점프수트/i.test(t)) return "APPAREL_DRESS";
  if (
    /pant|jean|denim|chino|cargo|short(?!-?sleeve)|jogger|legging|skirt|kilt|trouser|팬츠|바지|반바지|레깅스|스커트|치마|culotte|치노/i.test(t)
  )
    return "APPAREL_BOTTOM";
  if (
    /jacket|coat|parka|windbreaker|jumper|anorak|fleece|down|outer|vest|gilet|cardigan|블루종|자켓|재킷|코트|패딩|점퍼|아노락|플리스|베스트|블레이저|가디건/i.test(t)
  )
    return "APPAREL_OUTER";
  if (
    /polo|shirt|tee|t-?shirt|knit|sweater|sweatshirt|crop|tank|jersey|baselayer|hood(ie)?|sleeve|블라우스|셔츠|티셔츠|폴로|후드|니트|크롭|롱슬리브|반팔|긴팔|맨투맨|스웨트셔츠|탑|이너/i.test(t)
  )
    return "APPAREL_TOP";
  if (/caddybag|caddy-?bag|cart-?bag|stand-?bag|tour-?bag|골프백|캐디백/i.test(t))
    return "GOLF_BAG";
  if (/backpack|tote|crossbody|sling|duffle|messenger|handbag|가방|백팩|토트|보스턴/i.test(t))
    return "BAG";
  if (/driver|wedge|putter|iron|hybrid|fairway|club|드라이버|아이언|웨지|퍼터/i.test(t))
    return "GOLF_EQUIPMENT";
  if (/sock|belt|glove|watch|necklace|bracelet|marker|umbrella|티마커|볼마커|벨트|장갑|양말|마커|우산/i.test(t))
    return "ACCESSORY";
  if (/bra|seamless|underwear|브라|언더웨어/i.test(t)) return "UNDERWEAR";
  return "UNKNOWN";
}

async function fetchText(url, ms = 15_000) {
  const r = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept-Language": "ko-KR,ko;q=0.9",
      Accept: "text/html,application/xhtml+xml,application/xml,*/*",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(ms),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

async function fetchJson(url, ms = 15_000) {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    redirect: "follow",
    signal: AbortSignal.timeout(ms),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/** Shopify products.json — products.json?limit=250 */
async function extractShopify(brandSlug, originUrl) {
  const products = [];
  try {
    const data = await fetchJson(`${originUrl}/products.json?limit=250`);
    for (const p of data.products ?? []) {
      const title = p.title ?? "";
      const handle = p.handle;
      const type = bucketByText(title);
      const imageUrl = p.images?.[0]?.src;
      if (!imageUrl) continue;
      const variant = p.variants?.[0];
      products.push({
        name: title,
        sourceUrl: `${originUrl}/products/${handle}`,
        imageUrl,
        type,
        price: variant?.price ? parseInt(parseFloat(variant.price)) : undefined,
        compareAt: variant?.compare_at_price
          ? parseInt(parseFloat(variant.compare_at_price))
          : undefined,
      });
    }
  } catch (e) {
    process.stderr.write(`[${brandSlug}] shopify FAIL: ${e.message}\n`);
  }
  return products;
}

/** Shopify sitemap_products_1.xml — image:loc + image:title */
async function extractShopifySitemap(brandSlug, mainSitemapUrl) {
  const products = [];
  try {
    const indexXml = await fetchText(mainSitemapUrl);
    const m = indexXml.match(/https:\/\/[^/]+\/sitemap_products_1\.xml[^<]*/);
    if (!m) throw new Error("no sitemap_products_1");
    const productsUrl = m[0].replace(/&amp;/g, "&");
    const xml = await fetchText(productsUrl);
    // each <url> block contains <loc>{prodPage}</loc> + <image:loc>{img}</image:loc> + <image:title>{title}</image:title>
    const blocks = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
    for (const block of blocks) {
      const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
      const imgLoc = block.match(/<image:loc>([^<]+)<\/image:loc>/)?.[1];
      const titleRaw = block.match(/<image:title>([^<]+)<\/image:title>/)?.[1];
      if (!loc || !imgLoc || !titleRaw) continue;
      const title = titleRaw.replace(/&apos;/g, "'").replace(/&amp;/g, "&");
      products.push({
        name: title,
        sourceUrl: loc,
        imageUrl: imgLoc,
        type: bucketByText(title),
      });
    }
  } catch (e) {
    process.stderr.write(`[${brandSlug}] sitemap FAIL: ${e.message}\n`);
  }
  return products;
}

/** cafe24 sitemap.xml의 /product/ URL → 각 product 페이지 og:image (Playwright) */
async function extractCafe24Sitemap(browser, brandSlug, sitemapUrl, max = 60) {
  const products = [];
  try {
    const xml = await fetchText(sitemapUrl);
    const productUrls = Array.from(
      xml.matchAll(/<loc>([^<]*\/product\/[^<]+)<\/loc>/g)
    )
      .map((m) => m[1])
      .slice(0, max);

    const ctx = await browser.newContext({
      userAgent: UA,
      viewport: { width: 1280, height: 900 },
    });
    const page = await ctx.newPage();

    for (const url of productUrls) {
      try {
        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 12_000,
        });
        // og:image — 마지막 것이 보통 product 메인
        const ogImages = await page
          .locator('meta[property="og:image"]')
          .all();
        let og = "";
        for (const m of ogImages) {
          const c = await m.getAttribute("content");
          if (c && !/placehold|noimage|icon|sprite|svg/i.test(c)) og = c;
        }
        // og:title — 여러 개 있으면 brand-main이 아닌 product-specific 선택
        // 보통 첫 번째는 brand 이름, 마지막이 product
        const ogTitles = await page
          .locator('meta[property="og:title"]')
          .all();
        let ogTitle = "";
        for (const m of ogTitles) {
          const c = await m.getAttribute("content");
          if (!c) continue;
          // brand main pattern (예: "유타 골프 - UTAA Golfwear", "MARKANDLONA", "ANEW", 등)
          // → product specific은 보통 더 길고 SKU 코드 포함
          if (/golfwear|golf$|^\s*[A-Z\s&]+$/i.test(c) && c.length < 30) {
            // 짧은 brand 이름 → skip, 다음 후보 시도
            ogTitle = ogTitle || c; // fallback
            continue;
          }
          ogTitle = c;
          break;
        }
        // 그래도 없으면 마지막 ogTitle
        if (!ogTitle && ogTitles.length > 0) {
          ogTitle = (await ogTitles[ogTitles.length - 1].getAttribute("content")) ?? "";
        }
        if (!og || !ogTitle) continue;

        const slug = url.match(/\/product\/([^/]+)/)?.[1] ?? "";
        const type = bucketByText(`${ogTitle} ${slug}`);
        products.push({
          name: ogTitle.trim(),
          sourceUrl: url,
          imageUrl: og.startsWith("//") ? "https:" + og : og,
          type,
        });
      } catch {}
    }
    await ctx.close();
  } catch (e) {
    process.stderr.write(`[${brandSlug}] cafe24 FAIL: ${e.message}\n`);
  }
  return products;
}

/** Playwright SPA — collection page에서 product 카드 추출 */
async function extractSPA(browser, brandSlug, url, options) {
  const products = [];
  try {
    const ctx = await browser.newContext({
      userAgent: UA,
      viewport: { width: 1366, height: 900 },
    });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForTimeout(3000);
    // 스크롤로 lazy load 트리거
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
      await page.waitForTimeout(1500);
    }
    const items = await page.evaluate(
      ({ cardSel, titleSel, imgSel, linkSel }) => {
        const cards = Array.from(document.querySelectorAll(cardSel));
        return cards.slice(0, 80).map((card) => {
          const title = (card.querySelector(titleSel)?.textContent ?? "").trim();
          const link = card.querySelector(linkSel);
          const href = link?.getAttribute("href") ?? "";
          const img = card.querySelector(imgSel);
          let src = "";
          if (img) {
            const ss = img.getAttribute("srcset") || img.getAttribute("data-srcset");
            if (ss) {
              const c = ss
                .split(",")
                .map((s) => s.trim().split(/\s+/))
                .map(([u, w]) => ({ u, w: parseInt(w) || 0 }))
                .filter((x) => x.u);
              c.sort((a, b) => b.w - a.w);
              src = c[0]?.u ?? "";
            }
            if (!src)
              src =
                img.getAttribute("src") ||
                img.getAttribute("data-src") ||
                img.getAttribute("data-original") ||
                "";
          }
          return { title, href, src };
        });
      },
      options
    );
    const baseOrigin = new URL(url).origin;
    for (const { title, href, src } of items) {
      if (!title || !src) continue;
      let absSrc = src;
      if (absSrc.startsWith("//")) absSrc = "https:" + absSrc;
      else if (absSrc.startsWith("/")) absSrc = baseOrigin + absSrc;
      if (/placehold|noimage|svg-?icon|icon-|sprite/i.test(absSrc)) continue;
      let absHref = href;
      if (absHref.startsWith("/")) absHref = baseOrigin + absHref;
      products.push({
        name: title,
        sourceUrl: absHref || url,
        imageUrl: absSrc,
        type: bucketByText(title),
      });
    }
    await ctx.close();
  } catch (e) {
    process.stderr.write(`[${brandSlug}] SPA FAIL: ${e.message}\n`);
  }
  return products;
}

(async () => {
  const out = {};
  let total = 0;

  // ===== A: Shopify products.json =====
  const A_BRANDS = [
    ["markandlona", "https://markandlona-korea.co.kr"],
    ["waacgolf", "https://www.kolonmall.com"], // kolonmall은 Shopify 아닐 수도. Sitemap+selector 별도
  ];
  for (const [slug, origin] of A_BRANDS) {
    process.stderr.write(`[A:${slug}] products.json ... `);
    const items = await extractShopify(slug, origin);
    out[slug] = items;
    process.stderr.write(`${items.length} items\n`);
    total += items.length;
  }

  // ===== B: Shopify with redirect (302 → ?limit) =====
  const B_BRANDS = [
    ["thecart", "https://www.thecart.co.kr"],
    ["gfore", "https://www.gfore.kr"],
    ["southcape", "https://southcape.shop"],
  ];
  for (const [slug, origin] of B_BRANDS) {
    process.stderr.write(`[B:${slug}] products.json ... `);
    const items = await extractShopify(slug, origin);
    out[slug] = items;
    process.stderr.write(`${items.length} items\n`);
    total += items.length;
  }

  // ===== C: cafe24 sitemap → og:image (Playwright) =====
  const browser = await chromium.launch({ headless: true });

  // PXG 글로벌 sitemap (Shopify) + 한국 sitemap fallback
  process.stderr.write(`[C:pxg] global sitemap (shopify) ... `);
  const pxgItems = await extractShopifySitemap(
    "pxg",
    "https://www.pxg.com/sitemap.xml"
  );
  out.pxg = pxgItems;
  process.stderr.write(`${pxgItems.length} items\n`);
  total += pxgItems.length;

  const C_BRANDS = [
    ["amazingcre", "https://shop.amazingcre.com/sitemap.xml"],
    ["anew", "https://anewgolf.com/sitemap.xml"],
    ["utaa", "https://utaagolf.com/sitemap.xml"],
    ["titleist", "https://titleistapparel.co.kr/sitemap.xml"],
  ];
  for (const [slug, sitemapUrl] of C_BRANDS) {
    process.stderr.write(`[C:${slug}] sitemap+og ... `);
    const items = await extractCafe24Sitemap(browser, slug, sitemapUrl, 60);
    out[slug] = items;
    process.stderr.write(`${items.length} items\n`);
    total += items.length;
  }

  // ===== D: Playwright SPA =====
  const D_BRANDS = [
    [
      "malbon",
      "https://malbongolfkorea.com/category/all/",
      {
        cardSel: ".prdList li, .item, [class*='product']",
        titleSel: ".name, .prdName, h3, .product-title, strong",
        imgSel: "img",
        linkSel: "a",
      },
    ],
    [
      "iceberg",
      "https://iceberggolf.com/category/all/",
      {
        cardSel: ".prdList li, .item, [class*='product']",
        titleSel: ".name, .prdName, h3, strong",
        imgSel: "img",
        linkSel: "a",
      },
    ],
    [
      "pelt",
      "https://peltgolf.com/category/all/",
      {
        cardSel: ".prdList li, .item, [class*='product']",
        titleSel: ".name, .prdName, h3, strong",
        imgSel: "img",
        linkSel: "a",
      },
    ],
    [
      "bossgolf",
      "https://iamtom.co.kr/category/all/",
      {
        cardSel: ".prdList li, .item, [class*='product']",
        titleSel: ".name, .prdName, h3, strong",
        imgSel: "img",
        linkSel: "a",
      },
    ],
    [
      "descentegolf",
      "https://dk-on.com/DESCENTEGOLF",
      {
        cardSel: "[class*='product'], .item-card, li.product",
        titleSel: ".name, h3, .product-name",
        imgSel: "img",
        linkSel: "a",
      },
    ],
    [
      "bucketstore",
      "https://bucketstore.com/products",
      {
        cardSel: "[class*='product'], .grid__item, li.item",
        titleSel: ".name, h3, .product-title",
        imgSel: "img",
        linkSel: "a",
      },
    ],
    [
      "nikegolf",
      "https://www.nike.com/kr/w/golf-mens-clothing",
      {
        cardSel: "[data-test='product-card'], .product-card, .product",
        titleSel: "[data-test='product-card__title'], .product-card__title, h3",
        imgSel: "img",
        linkSel: "a",
      },
    ],
  ];
  for (const [slug, url, options] of D_BRANDS) {
    process.stderr.write(`[D:${slug}] SPA ${url} ... `);
    const items = await extractSPA(browser, slug, url, options);
    out[slug] = items;
    process.stderr.write(`${items.length} items\n`);
    total += items.length;
  }

  await browser.close();

  process.stderr.write(`\nTOTAL: ${total} products across ${Object.keys(out).length} brands\n`);
  console.log(JSON.stringify(out, null, 2));
})();
