// 크롤러 CLI — `npx tsx scripts/crawl.ts --site all|<id> --mode full|update [--limit N] [--concurrency N] [--dry-run]`
// 앱 밖 배치. --dry-run은 DB 없이 파싱 결과만 출력. 그 외엔 DRAFT로 저장(기존 importer 재사용).
import { readFileSync } from "node:fs";
import { runWithConcurrency } from "../src/lib/crawler/engine/scheduler";
import { evaluateCrawlAlert, notifySlack } from "../src/lib/crawler/engine/alerts";
import { SITES, getSite } from "../src/lib/crawler/sites.config";
import { getAdapter } from "../src/lib/crawler/adapters";
import type { SiteConfig } from "../src/lib/crawler/engine/types";
import type { CrawledProduct } from "../src/lib/crawler/types";

/** tsx는 .env 자동 로드 안 함 → prisma 임포트 전에 수동 주입. */
function loadEnv(): void {
  try {
    for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
      }
    }
  } catch {
    /* .env 없으면 기존 env 사용 */
  }
}

interface Opts {
  site: string;
  mode: "full" | "update";
  concurrency: number;
  limit: number;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Opts {
  const val = (k: string, d: string) => {
    const i = argv.indexOf(`--${k}`);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
  };
  return {
    site: val("site", "all"),
    mode: val("mode", "full") === "update" ? "update" : "full",
    concurrency: parseInt(val("concurrency", "3"), 10) || 3,
    limit: parseInt(val("limit", "50"), 10) || 50,
    dryRun: argv.includes("--dry-run"),
  };
}

type Deps = {
  prisma: {
    crawlJob: {
      create: (a: unknown) => Promise<{ id: string }>;
      update: (a: unknown) => Promise<unknown>;
      findFirst: (a: unknown) => Promise<{ totalItems: number } | null>;
    };
    $disconnect: () => Promise<void>;
  };
  persist: (p: CrawledProduct[], jobId: string) => Promise<{ imported: number; skipped: number; errors: string[] }>;
};

interface SiteResult {
  site: string;
  collected: number;
  imported: number;
  skipped: number;
  errors: number;
}

async function crawlSite(cfg: SiteConfig, opts: Opts, deps: Deps | null): Promise<SiteResult> {
  try {
    const adapter = getAdapter(cfg.platform);
    const products = await adapter.collect(cfg, { limit: opts.limit });

    if (opts.dryRun || !deps) {
      console.log(`\n[${cfg.id}] ${products.length}건 (dry-run) 샘플:`);
      for (const p of products.slice(0, 3)) {
        console.log(`  - ${p.name} | ${p.brandName} | ${p.originalPrice.toLocaleString()}원 | img:${p.imageUrls.length} | ${p.sourceUrl}`);
      }
      return { site: cfg.id, collected: products.length, imported: 0, skipped: 0, errors: 0 };
    }

    const job = await deps.prisma.crawlJob.create({
      data: { sourceSite: cfg.id, targetUrl: cfg.baseUrl, status: "RUNNING", startedAt: new Date() },
    });
    // 이전 실행(같은 사이트, 완료) 수집수 — 급감 판정용
    const prev = await deps.prisma.crawlJob.findFirst({
      where: { sourceSite: cfg.id, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      select: { totalItems: true },
    });
    const r = await deps.persist(products, job.id);
    const warning = evaluateCrawlAlert(products.length, prev?.totalItems ?? null);
    await deps.prisma.crawlJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        totalItems: products.length,
        successItems: r.imported,
        failedItems: r.errors.length,
        warning,
        completedAt: new Date(),
      },
    });
    console.log(`[${cfg.id}] 수집 ${products.length} → import ${r.imported} (skip ${r.skipped}, err ${r.errors.length}) job=${job.id}`);
    if (warning) {
      console.warn(`  ⚠️  [${cfg.id}] ${warning}`);
      await notifySlack(`${cfg.id}: ${warning}`);
    }
    return { site: cfg.id, collected: products.length, imported: r.imported, skipped: r.skipped, errors: r.errors.length };
  } catch (e: unknown) {
    console.error(`[${cfg.id}] 실패: ${e instanceof Error ? e.message : String(e)}`);
    return { site: cfg.id, collected: 0, imported: 0, skipped: 0, errors: 1 };
  }
}

async function main(): Promise<void> {
  loadEnv();
  const opts = parseArgs(process.argv.slice(2));
  const sites: SiteConfig[] =
    opts.site === "all" ? SITES : getSite(opts.site) ? [getSite(opts.site)!] : [];
  if (!sites.length) {
    console.error(`알 수 없는 site: ${opts.site} (가능: all, ${SITES.map((s) => s.id).join(", ")})`);
    process.exit(1);
  }
  console.log(`크롤 시작: [${sites.map((s) => s.id).join(", ")}] mode=${opts.mode} limit=${opts.limit} concurrency=${opts.concurrency} dryRun=${opts.dryRun}`);

  let deps: Deps | null = null;
  if (!opts.dryRun) {
    const dbMod = (await import("../src/lib/db")) as unknown as { prisma: Deps["prisma"] };
    const stMod = (await import("../src/lib/crawler/engine/storage")) as unknown as { persist: Deps["persist"] };
    deps = { prisma: dbMod.prisma, persist: stMod.persist };
  }

  const results = await runWithConcurrency(
    sites.map((cfg) => () => crawlSite(cfg, opts, deps)),
    opts.concurrency,
  );

  console.log("\n=== 요약 ===");
  console.table(results);
  if (deps) await deps.prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
