// 이미지 로컬라이즈 CLI — `npx tsx scripts/localize-images.ts [--site <id>] [--limit N]`
// 크롤링으로 저장된 외부 핫링크 이미지를 자체 스토리지로 이전 + 남은 핫링크 수 검증.
import { readFileSync } from "node:fs";

function loadEnv(): void {
  try {
    for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  } catch {
    /* .env 없으면 기존 env */
  }
}

async function main(): Promise<void> {
  loadEnv();
  const argv = process.argv.slice(2);
  const val = (k: string, d: string) => {
    const i = argv.indexOf(`--${k}`);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
  };
  const site = val("site", "");
  const limit = parseInt(val("limit", "500"), 10) || 500;

  const { localizeProductImages, countRemainingHotlinks } = await import(
    "../src/lib/crawler/engine/image-pipeline"
  );
  const before = await countRemainingHotlinks(site || undefined);
  console.log(`이전 핫링크 수: ${before} (site=${site || "all-crawled"})`);
  const r = await localizeProductImages({ site: site || undefined, limit });
  const after = await countRemainingHotlinks(site || undefined);
  console.log(
    `\nuploader=${r.uploader} | 후보 ${r.candidates} → 로컬라이즈 ${r.localized}, 실패 ${r.failed}`,
  );
  console.log(`남은 핫링크 수: ${after}`);
  if (r.failures.length) console.log("실패 샘플:\n  " + r.failures.join("\n  "));

  const { prisma } = await import("../src/lib/db");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
