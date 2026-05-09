/**
 * 일반화된 이미지 추출기.
 *
 * 입력: 페이지 HTML + base URL
 * 출력: 후보 이미지 URL 배열 (절대 URL, 중복 제거, 큰 것 위주)
 *
 * 추출 우선순위:
 * 1. JSON-LD `Product`, `ItemList`의 image 필드
 * 2. og:image / twitter:image (페이지 대표 이미지 — 1~2개만)
 * 3. <img> 태그 (lazy-load 속성 포함, srcset에서 가장 큰 해상도)
 *
 * 휴리스틱:
 * - src/data-src/data-original 모두 검사
 * - srcset 있으면 가장 큰 해상도 후보 채택
 * - placehold.co, 1x1 픽셀, sprite, icon, logo 패턴 제외
 * - 절대 URL 변환
 */

import * as cheerio from "cheerio";

const EXCLUDE_PATTERN =
  /(placehold\.co|placeholder|1x1\.|spacer|blank\.|icon|favicon|logo[-_./]|sprite|emoji|tracking|pixel\.gif|loading\.gif|loader\.gif)/i;

const IMAGE_EXT_RE = /\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i;

export interface ExtractedImage {
  url: string;
  source: "jsonld" | "og" | "img";
  hint?: string;
}

export function extractImagesFromPage(
  html: string,
  baseUrl: string
): ExtractedImage[] {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const results: ExtractedImage[] = [];

  function add(rawUrl: string | undefined, source: ExtractedImage["source"], hint?: string) {
    if (!rawUrl || typeof rawUrl !== "string") return;
    let url = rawUrl.trim();
    if (!url) return;

    // 프로토콜 상대 URL → https
    if (url.startsWith("//")) url = "https:" + url;
    // 절대 URL 변환
    try {
      url = new URL(url, baseUrl).toString();
    } catch {
      return;
    }

    // 비-이미지 또는 의심 URL 제외
    if (EXCLUDE_PATTERN.test(url)) return;
    // 확장자 없는 경우 — Shopify CDN 일부는 ?v=... 등 쿼리만 있음. 너그럽게 통과
    // 다만 명백히 css/js/json은 제외
    if (/\.(css|js|json|svg)(\?|#|$)/i.test(url)) return;

    if (seen.has(url)) return;
    seen.add(url);
    results.push({ url, source, hint });
  }

  // 1) JSON-LD
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text().trim();
    if (!raw) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    const stack: unknown[] = Array.isArray(parsed) ? [...parsed] : [parsed];
    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== "object") continue;
      const obj = node as Record<string, unknown>;
      // image 필드
      const img = obj.image;
      if (typeof img === "string") add(img, "jsonld", String(obj["@type"] ?? ""));
      else if (Array.isArray(img)) {
        for (const i of img) {
          if (typeof i === "string") add(i, "jsonld", String(obj["@type"] ?? ""));
          else if (i && typeof i === "object") {
            const u = (i as Record<string, unknown>).url;
            if (typeof u === "string") add(u, "jsonld", String(obj["@type"] ?? ""));
          }
        }
      } else if (img && typeof img === "object") {
        const u = (img as Record<string, unknown>).url;
        if (typeof u === "string") add(u, "jsonld", String(obj["@type"] ?? ""));
      }
      // 중첩 배열 탐색
      for (const v of Object.values(obj)) {
        if (Array.isArray(v)) stack.push(...v);
        else if (v && typeof v === "object") stack.push(v);
      }
    }
  });

  // 2) og:image / twitter:image
  $('meta[property="og:image"], meta[name="og:image"], meta[name="twitter:image"], meta[property="og:image:url"]').each((_, el) => {
    add($(el).attr("content"), "og", "meta");
  });

  // 3) <img> 태그
  $("img").each((_, el) => {
    const $el = $(el);

    // srcset 우선 — 가장 큰 해상도 선택
    const srcset = $el.attr("srcset") || $el.attr("data-srcset");
    if (srcset) {
      // "url 480w, url 720w, url 1024w" 형식
      const candidates = srcset
        .split(",")
        .map((s) => s.trim())
        .map((s) => {
          const parts = s.split(/\s+/);
          const url = parts[0];
          const w = parts[1] && parts[1].endsWith("w") ? parseInt(parts[1]) : 0;
          return { url, w };
        })
        .filter((c) => c.url);
      if (candidates.length) {
        candidates.sort((a, b) => b.w - a.w);
        add(candidates[0].url, "img", "srcset");
      }
    }

    const src =
      $el.attr("src") ||
      $el.attr("data-src") ||
      $el.attr("data-original") ||
      $el.attr("data-lazy-src") ||
      $el.attr("data-image");
    if (!src) return;

    // 작은 이미지 제외 (width/height 명시된 경우)
    const w = parseInt($el.attr("width") || "0");
    const h = parseInt($el.attr("height") || "0");
    if (w > 0 && w < 200) return;
    if (h > 0 && h < 200) return;

    // 확장자나 경로 패턴이 이미지스러운 것만
    if (!IMAGE_EXT_RE.test(src) && !/(cdn|product|catalog|shop|image|upload|media)/i.test(src)) {
      return;
    }

    add(src, "img");
  });

  return results;
}

/**
 * 추출된 이미지 중 "상품 이미지"로 가장 적합한 것들만 필터링.
 * og:image는 보통 1개만 (메인), JSON-LD/img는 다수.
 *
 * @param images 추출 결과
 * @param maxCount 최대 반환 개수 (default 16)
 */
export function pickProductImages(
  images: ExtractedImage[],
  maxCount = 16
): string[] {
  // jsonld + img 우선, og는 후순위 (대표 이미지 1개로만)
  const ranked = [...images].sort((a, b) => {
    const order = { jsonld: 0, img: 1, og: 2 } as const;
    return order[a.source] - order[b.source];
  });

  const out: string[] = [];
  for (const img of ranked) {
    if (out.includes(img.url)) continue;
    out.push(img.url);
    if (out.length >= maxCount) break;
  }
  return out;
}
