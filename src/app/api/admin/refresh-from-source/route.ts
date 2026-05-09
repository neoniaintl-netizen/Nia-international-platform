import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as cheerio from "cheerio";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 300;

const BodySchema = z
  .object({
    brandSlug: z.string().min(1).max(100).optional(),
    /** 한 번에 처리할 최대 product 수 (timeout 방지) */
    limit: z.number().int().min(1).max(100).optional().default(30),
    dryRun: z.boolean().optional().default(true),
  })
  .strict();

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const EXCLUDE_PATTERN =
  /(placehold\.co|placeholder|spacer|blank\.|favicon|sprite|loading\.gif)/i;

/**
 * POST /api/admin/refresh-from-source
 *
 * 각 Product의 sourceUrl을 fetch해서 og:image / JSON-LD product image를
 * 추출해 ProductImage를 갱신. 같은 product의 정확한 이미지 매핑.
 *
 * Body: { brandSlug?, limit?, dryRun? }
 *
 * 정책:
 * - sourceUrl 없는 product는 skip
 * - fetch 실패하는 product도 skip (DB 변경 없음)
 * - og:image / JSON-LD image / hero img 우선 추출
 * - 기존 이미지 모두 삭제 후 새 이미지로 교체
 *
 * 한 번에 limit 개만 처리. 더 처리하려면 여러 번 호출.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }
  const { brandSlug, limit, dryRun } = parsed.data;

  // brand 필터 + sourceUrl이 있는 product만
  const products = await prisma.product.findMany({
    where: {
      sourceUrl: { not: null },
      ...(brandSlug
        ? {
            brand: {
              OR: [
                { slug: brandSlug },
                { slug: brandSlug.replace("-", "") },
                { name: { contains: brandSlug.replace("-", " "), mode: "insensitive" } },
              ],
            },
          }
        : {}),
    },
    take: limit,
    include: {
      brand: { select: { name: true, slug: true } },
      images: { select: { url: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  type Result = {
    productId: string;
    productName: string;
    brandSlug: string | null;
    sourceUrl: string;
    extracted?: number;
    extractedSample?: string[];
    updated?: boolean;
    error?: string;
  };
  const results: Result[] = [];

  for (const product of products) {
    const result: Result = {
      productId: product.id,
      productName: product.name,
      brandSlug: product.brand?.slug ?? null,
      sourceUrl: product.sourceUrl!,
    };

    try {
      const r = await fetch(product.sourceUrl!, {
        headers: {
          "User-Agent": UA,
          Accept: "text/html",
          "Accept-Language": "ko-KR,ko;q=0.9",
        },
        signal: AbortSignal.timeout(12_000),
      });
      if (!r.ok) {
        result.error = `HTTP ${r.status}`;
        results.push(result);
        continue;
      }
      const html = await r.text();
      const $ = cheerio.load(html);

      const collected: string[] = [];

      const add = (url: string | undefined) => {
        if (!url) return;
        let u = url.trim();
        if (!u) return;
        if (u.startsWith("//")) u = "https:" + u;
        try {
          u = new URL(u, product.sourceUrl!).toString();
        } catch {
          return;
        }
        if (EXCLUDE_PATTERN.test(u)) return;
        if (collected.includes(u)) return;
        collected.push(u);
      };

      // 1) og:image / twitter:image
      $(
        'meta[property="og:image"], meta[property="og:image:url"], meta[name="twitter:image"]'
      ).each((_, el) => add($(el).attr("content")));

      // 2) JSON-LD Product image
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
          const img = obj.image;
          if (typeof img === "string") add(img);
          else if (Array.isArray(img))
            for (const i of img) {
              if (typeof i === "string") add(i);
              else if (i && typeof i === "object" && typeof (i as { url?: unknown }).url === "string")
                add((i as { url: string }).url);
            }
          else if (img && typeof img === "object" && typeof (img as { url?: unknown }).url === "string")
            add((img as { url: string }).url);
          for (const v of Object.values(obj)) {
            if (Array.isArray(v)) stack.push(...v);
            else if (v && typeof v === "object") stack.push(v);
          }
        }
      });

      // 3) main img — gallery 류 (제한)
      $("img").each((_, el) => {
        if (collected.length >= 8) return;
        const $el = $(el);
        const src =
          $el.attr("src") ||
          $el.attr("data-src") ||
          $el.attr("data-original");
        if (!src) return;
        // 큰 이미지만
        const w = parseInt($el.attr("width") || "0");
        if (w > 0 && w < 300) return;
        // product / catalog / cdn 패턴만 통과
        if (!/(cdn|product|catalog|shop|image|upload|media)/i.test(src)) return;
        add(src);
      });

      result.extracted = collected.length;
      result.extractedSample = collected.slice(0, 3);

      if (collected.length === 0) {
        result.error = "no images extracted";
        results.push(result);
        continue;
      }

      if (!dryRun) {
        const newUrls = collected.slice(0, 6);
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
        result.updated = true;
      }
    } catch (e) {
      result.error = e instanceof Error ? e.message : String(e);
    }
    results.push(result);
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    summary: {
      processed: results.length,
      withImages: results.filter((r) => (r.extracted ?? 0) > 0).length,
      updated: results.filter((r) => r.updated).length,
      errors: results.filter((r) => r.error).length,
    },
    results,
  });
}
