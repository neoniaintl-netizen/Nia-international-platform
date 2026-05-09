// 9개 브랜드 사이트에서 이미지 URL 직접 추출하는 로컬 스크립트.
// 한국 IP에서 실행해야 차단 회피 가능 (Alo Yoga 한국어 페이지 등).
//
// 사용: node scripts/extract-brand-images.mjs > extracted.json

import * as cheerio from "cheerio";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const BRANDS = [
  {
    slug: "salomon",
    urls: [
      "https://salomon.co.kr/collections/sal-bestseller-all",
      "https://salomon.co.kr/collections/sal-all-shoes",
    ],
    referer: "https://salomon.co.kr/",
  },
  {
    slug: "patagonia",
    urls: [
      "https://www.patagonia.co.kr/shop/mens.html",
      "https://www.patagonia.co.kr/shop/womens.html",
    ],
    referer: "https://www.patagonia.co.kr/",
  },
  {
    slug: "arcteryx",
    urls: [
      "https://arcteryx.co.kr/",
      "https://arcteryx.co.kr/product/list.html?cate_no=24",
      "https://arcteryx.co.kr/product/list.html?cate_no=43",
    ],
    referer: "https://arcteryx.co.kr/",
  },
  {
    slug: "thenorthface",
    urls: [
      "https://www.thenorthfacekorea.co.kr/category/n/men/jacket-vest",
      "https://www.thenorthfacekorea.co.kr/category/n/women/jacket-vest",
    ],
    referer: "https://www.thenorthfacekorea.co.kr/",
  },
  {
    slug: "kolonsport",
    urls: [
      "https://www.kolonsport.com/category/men/jacket",
      "https://www.kolonsport.com/category/women/jacket",
    ],
    referer: "https://www.kolonsport.com/",
  },
  {
    slug: "descente",
    urls: [
      "https://dk-on.com/",
      "https://dk-on.com/product/list.html",
      "https://dk-on.com/category",
    ],
    referer: "https://dk-on.com/",
  },
  {
    slug: "wilson",
    urls: [
      "https://kr.wilson.com/collections/women-shoes-all",
      "https://kr.wilson.com/collections/men-shoes-all",
    ],
    referer: "https://kr.wilson.com/",
  },
  {
    slug: "aloyoga",
    urls: [
      "https://www.aloyoga.com/ko-kr/",
      "https://www.aloyoga.com/ko-kr/collections/best-sellers",
      "https://www.aloyoga.com/ko-kr/pages/main",
    ],
    referer: "https://www.aloyoga.com/",
  },
  {
    slug: "nike-skims",
    urls: [
      "https://www.nike.com/kr/nikeskims",
      "https://www.nike.com/kr/launch",
      "https://www.nike.com/kr/w/womens-clothing-5e1x6",
    ],
    referer: "https://www.nike.com/",
  },
];

const EXCLUDE =
  /(placehold\.co|placeholder|1x1\.|spacer|blank\.|icon|favicon|logo[-_./]|sprite|emoji|tracking|pixel\.gif|loading\.gif|loader\.gif|google-tag|gtm|analytics|facebook\.com\/tr)/i;

function extract(html, baseUrl) {
  const $ = cheerio.load(html);
  const seen = new Set();
  const out = [];

  function add(rawUrl, source) {
    if (!rawUrl || typeof rawUrl !== "string") return;
    let url = rawUrl.trim();
    if (!url) return;
    if (url.startsWith("//")) url = "https:" + url;
    try {
      url = new URL(url, baseUrl).toString();
    } catch {
      return;
    }
    if (EXCLUDE.test(url)) return;
    if (/\.(css|js|json|svg)(\?|#|$)/i.test(url)) return;
    if (seen.has(url)) return;
    seen.add(url);
    out.push({ url, source });
  }

  // JSON-LD
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text().trim();
    if (!raw) return;
    let p;
    try {
      p = JSON.parse(raw);
    } catch {
      return;
    }
    const stack = Array.isArray(p) ? [...p] : [p];
    while (stack.length) {
      const n = stack.pop();
      if (!n || typeof n !== "object") continue;
      const img = n.image;
      if (typeof img === "string") add(img, "jsonld");
      else if (Array.isArray(img))
        for (const i of img) {
          if (typeof i === "string") add(i, "jsonld");
          else if (i && typeof i === "object" && typeof i.url === "string")
            add(i.url, "jsonld");
        }
      else if (img && typeof img === "object" && typeof img.url === "string")
        add(img.url, "jsonld");
      for (const v of Object.values(n)) {
        if (Array.isArray(v)) stack.push(...v);
        else if (v && typeof v === "object") stack.push(v);
      }
    }
  });

  // og:image
  $(
    'meta[property="og:image"], meta[name="og:image"], meta[name="twitter:image"], meta[property="og:image:url"]'
  ).each((_, el) => add($(el).attr("content"), "og"));

  // <img>
  $("img").each((_, el) => {
    const $el = $(el);
    const srcset = $el.attr("srcset") || $el.attr("data-srcset");
    if (srcset) {
      const c = srcset
        .split(",")
        .map((s) => s.trim())
        .map((s) => {
          const p = s.split(/\s+/);
          return { url: p[0], w: p[1]?.endsWith("w") ? parseInt(p[1]) : 0 };
        })
        .filter((x) => x.url);
      if (c.length) {
        c.sort((a, b) => b.w - a.w);
        add(c[0].url, "img");
      }
    }
    const src =
      $el.attr("src") ||
      $el.attr("data-src") ||
      $el.attr("data-original") ||
      $el.attr("data-lazy-src");
    if (!src) return;
    const w = parseInt($el.attr("width") || "0");
    if (w > 0 && w < 200) return;
    if (!/\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i.test(src) &&
      !/(cdn|product|catalog|shop|image|upload|media)/i.test(src))
      return;
    add(src, "img");
  });

  // 우선순위: jsonld > img > og
  out.sort((a, b) => {
    const o = { jsonld: 0, img: 1, og: 2 };
    return o[a.source] - o[b.source];
  });
  return out;
}

const result = {};
for (const brand of BRANDS) {
  const collected = [];
  const errors = [];
  for (const url of brand.urls) {
    try {
      const r = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
          Referer: brand.referer,
        },
        signal: AbortSignal.timeout(20_000),
      });
      if (!r.ok) {
        errors.push(`${url}: HTTP ${r.status}`);
        continue;
      }
      const html = await r.text();
      const ex = extract(html, url);
      for (const x of ex) {
        if (!collected.find((c) => c.url === x.url)) collected.push(x);
        if (collected.length >= 16) break;
      }
      if (collected.length >= 16) break;
    } catch (e) {
      errors.push(`${url}: ${e.message}`);
    }
  }
  result[brand.slug] = {
    images: collected.slice(0, 12).map((x) => x.url),
    errors,
  };
  console.error(
    `[${brand.slug}] ${collected.length} images, ${errors.length} errors`
  );
}

console.log(JSON.stringify(result, null, 2));
