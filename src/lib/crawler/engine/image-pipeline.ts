// 이미지 파이프라인 — 크롤링으로 저장된 외부(핫링크) 이미지를 다운로드→자체 스토리지 업로드→URL 교체.
// 크롤링과 분리 실행(별도 모듈/스크립트).
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { getUploader } from "./image-storage";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function downloadImage(
  url: string,
): Promise<{ body: Buffer; contentType: string; ext: string } | null> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "image/*,*/*" },
    signal: AbortSignal.timeout(20_000),
    redirect: "follow",
  });
  if (!res.ok) return null;
  const ct = res.headers.get("content-type") || "";
  if (!ct.startsWith("image/")) return null;
  const body = Buffer.from(await res.arrayBuffer());
  if (body.length < 100) return null; // 깨진/placeholder 방지
  const ext = ct.includes("png")
    ? "png"
    : ct.includes("webp")
      ? "webp"
      : ct.includes("gif")
        ? "gif"
        : ct.includes("avif")
          ? "avif"
          : "jpg";
  return { body, contentType: ct, ext };
}

export interface LocalizeResult {
  uploader: string;
  candidates: number;
  localized: number;
  failed: number;
  failures: string[];
}

/**
 * 외부(http로 시작) 이미지 URL을 가진 ProductImage 를 자체 스토리지로 이전.
 * @param opts.site  특정 sourceSite 만 (미지정 시 크롤링 상품 전체)
 * @param opts.limit 최대 처리 이미지 수
 */
export async function localizeProductImages(opts: {
  site?: string;
  limit?: number;
}): Promise<LocalizeResult> {
  const uploader = getUploader();
  const images = await prisma.productImage.findMany({
    where: {
      url: { startsWith: "http" }, // 자체 URL(/uploads/…)은 제외
      product: opts.site ? { sourceSite: opts.site } : { sourceSite: { not: null } },
    },
    take: opts.limit ?? 500,
    select: { id: true, url: true, productId: true },
  });

  let localized = 0;
  let failed = 0;
  const failures: string[] = [];
  for (const img of images) {
    try {
      const dl = await downloadImage(img.url);
      if (!dl) {
        failed++;
        failures.push(`${img.url} (다운로드 실패/이미지 아님)`);
        continue;
      }
      const hash = createHash("sha1").update(img.url).digest("hex").slice(0, 16);
      const key = `${img.productId}/${hash}.${dl.ext}`;
      const newUrl = await uploader.upload(key, dl.body, dl.contentType);
      await prisma.productImage.update({ where: { id: img.id }, data: { url: newUrl } });
      localized++;
      await new Promise((r) => setTimeout(r, 120)); // CDN 부하 방지 소딜레이
    } catch (e: unknown) {
      failed++;
      failures.push(`${img.url}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { uploader: uploader.kind, candidates: images.length, localized, failed, failures: failures.slice(0, 20) };
}

/** 검증용: 아직 외부 핫링크로 남아있는 크롤링 상품 이미지 수. */
export async function countRemainingHotlinks(site?: string): Promise<number> {
  return prisma.productImage.count({
    where: {
      url: { startsWith: "http" },
      product: site ? { sourceSite: site } : { sourceSite: { not: null } },
    },
  });
}
