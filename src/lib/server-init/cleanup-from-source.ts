/**
 * 각 product의 sourceUrl을 직접 fetch해서 og:image / JSON-LD product image를
 * 추출해 ProductImage를 갱신.
 *
 * 멱등성: 이미 진짜 이미지(placehold.co가 아니고 mismatch 아님)를 가진 product는 skip.
 * 우선순위: placeholder만 가진 product → mismatch 의심 product → skip된 나머지.
 *
 * 매 컨테이너 시작 시 background로 1회 실행. 30초 timeout.
 * 한 번에 처리 못 한 product는 다음 deploy 시 처리.
 */

import { prisma } from "@/lib/db";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const EXCLUDE_URL_PATTERN =
  /(placehold\.co|placeholder|spacer|blank\.|favicon|sprite|loading\.gif|svg-?icon|\.svg(\?|$))/i;

const MAX_PER_RUN = 40;
const FETCH_TIMEOUT_MS = 12_000;
const TOTAL_TIMEOUT_MS = 28_000;

let alreadyRan = false;

/**
 * HTML에서 og:image / JSON-LD Product.image / 첫 큰 img 추출.
 */
function extractImagesFromHtml(html: string, baseUrl: string): string[] {
  const collected: string[] = [];

  function add(url: string | undefined) {
    if (!url) return;
    let u = url.trim();
    if (!u) return;
    if (u.startsWith("//")) u = "https:" + u;
    try {
      u = new URL(u, baseUrl).toString();
    } catch {
      return;
    }
    if (EXCLUDE_URL_PATTERN.test(u)) return;
    if (collected.includes(u)) return;
    collected.push(u);
  }

  // og:image
  const ogMatches = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi
  );
  if (ogMatches) {
    for (const m of ogMatches) {
      const c = m.match(/content=["']([^"']+)["']/);
      if (c) add(c[1]);
    }
  }

  // og:image:url 또는 twitter:image
  const otherMatches = html.match(
    /<meta[^>]+(?:property|name)=["'](?:og:image:url|twitter:image)["'][^>]+content=["']([^"']+)["']/gi
  );
  if (otherMatches) {
    for (const m of otherMatches) {
      const c = m.match(/content=["']([^"']+)["']/);
      if (c) add(c[1]);
    }
  }

  // JSON-LD Product image
  const jsonLdMatches = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  for (const m of jsonLdMatches) {
    try {
      const json = JSON.parse(m[1].trim());
      const stack: unknown[] = Array.isArray(json) ? [...json] : [json];
      while (stack.length) {
        const node = stack.pop();
        if (!node || typeof node !== "object") continue;
        const obj = node as Record<string, unknown>;
        const img = obj.image;
        if (typeof img === "string") add(img);
        else if (Array.isArray(img))
          for (const i of img) {
            if (typeof i === "string") add(i);
            else if (
              i &&
              typeof i === "object" &&
              typeof (i as { url?: unknown }).url === "string"
            )
              add((i as { url: string }).url);
          }
        else if (
          img &&
          typeof img === "object" &&
          typeof (img as { url?: unknown }).url === "string"
        )
          add((img as { url: string }).url);
        for (const v of Object.values(obj)) {
          if (Array.isArray(v)) stack.push(...v);
          else if (v && typeof v === "object") stack.push(v);
        }
      }
    } catch {}
    if (collected.length >= 8) break;
  }

  return collected;
}

async function processProduct(product: {
  id: string;
  name: string;
  sourceUrl: string | null;
  images: { id: string; url: string }[];
}): Promise<{ updated: boolean; reason?: string }> {
  if (!product.sourceUrl) return { updated: false, reason: "no sourceUrl" };

  let html: string;
  try {
    const r = await fetch(product.sourceUrl, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!r.ok) return { updated: false, reason: `HTTP ${r.status}` };
    html = await r.text();
  } catch (e) {
    return {
      updated: false,
      reason: `fetch: ${e instanceof Error ? e.message.slice(0, 60) : "fail"}`,
    };
  }

  const images = extractImagesFromHtml(html, product.sourceUrl);
  if (images.length === 0)
    return { updated: false, reason: "no images extracted" };

  const newUrls = images.slice(0, 6);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: product.id } });
      for (let j = 0; j < newUrls.length; j++) {
        await tx.productImage.create({
          data: {
            productId: product.id,
            url: newUrls[j],
            isMain: j === 0,
            sortOrder: j,
          },
        });
      }
    });
    return { updated: true };
  } catch (e) {
    return {
      updated: false,
      reason: `db: ${e instanceof Error ? e.message.slice(0, 60) : "fail"}`,
    };
  }
}

async function doRun() {
  // 우선순위 1: placeholder만 가진 product (가장 시급)
  const placeholderOnly = await prisma.product.findMany({
    where: {
      sourceUrl: { not: null },
      images: {
        every: {
          OR: [
            { url: { contains: "placehold.co" } },
            { url: { contains: "placeholder" } },
          ],
        },
      },
    },
    take: MAX_PER_RUN,
    include: { images: { select: { id: true, url: true } } },
    orderBy: { createdAt: "asc" },
  });

  let processed = 0;
  let updated = 0;
  const errors: string[] = [];
  const startedAt = Date.now();

  for (const product of placeholderOnly) {
    if (Date.now() - startedAt > TOTAL_TIMEOUT_MS) {
      console.log("[server-init/from-source] total timeout reached");
      break;
    }
    processed += 1;
    const r = await processProduct(product);
    if (r.updated) updated += 1;
    else if (r.reason) errors.push(`${product.name.slice(0, 30)}: ${r.reason}`);
  }

  console.log(
    `[server-init/from-source] processed=${processed} updated=${updated} errors=${errors.length} sample=${errors.slice(0, 3).join(" | ")}`
  );
}

export async function runFromSource(): Promise<void> {
  if (alreadyRan) return;
  alreadyRan = true;

  if (!process.env.DATABASE_URL) {
    console.log("[server-init/from-source] DATABASE_URL not set, skip");
    return;
  }

  // 35초 hard timeout (TOTAL_TIMEOUT_MS보다 약간 큼)
  const timeout = new Promise<void>((resolve) =>
    setTimeout(() => {
      console.error("[server-init/from-source] hard timeout 35s");
      resolve();
    }, 35_000)
  );

  try {
    await Promise.race([doRun(), timeout]);
  } catch (e) {
    console.error("[server-init/from-source] outer:", e);
  }
}
