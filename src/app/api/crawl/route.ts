import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCrawler } from "@/lib/crawler";
import { importCrawledProducts } from "@/lib/crawler/product-importer";

/**
 * POST /api/crawl
 * 크롤링 작업 트리거 API
 *
 * Body: { sourceSite, targetUrl, maxItems?, apiKey }
 * apiKey는 환경변수 CRAWL_API_KEY와 매칭
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceSite, targetUrl, maxItems = 50, apiKey } = body;

    // API 키 검증
    const validKey = process.env.CRAWL_API_KEY;
    if (validKey && apiKey !== validKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!sourceSite || !targetUrl) {
      return NextResponse.json(
        { error: "sourceSite and targetUrl are required" },
        { status: 400 }
      );
    }

    // CrawlJob 생성
    const job = await prisma.crawlJob.create({
      data: {
        sourceSite,
        targetUrl,
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    // 크롤링 실행
    try {
      const crawler = getCrawler(sourceSite);
      const result = await crawler.crawl({
        sourceSite,
        targetUrl,
        maxItems,
        delayMs: 800,
      });

      const importResult = await importCrawledProducts(result.products, job.id);

      const allErrors = [...result.errors, ...importResult.errors];
      await prisma.crawlJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          totalItems: result.totalItems,
          successItems: importResult.imported,
          failedItems: result.failedItems + importResult.errors.length,
          errorLog: allErrors.length > 0 ? allErrors.join("\n") : null,
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        jobId: job.id,
        totalItems: result.totalItems,
        imported: importResult.imported,
        skipped: importResult.skipped,
        errors: allErrors.length,
      });
    } catch (crawlError: any) {
      await prisma.crawlJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          errorLog: crawlError.message,
          completedAt: new Date(),
        },
      });

      return NextResponse.json(
        { error: crawlError.message, jobId: job.id },
        { status: 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/crawl?jobId=xxx
 * 크롤링 작업 상태 조회
 */
export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");

  if (jobId) {
    const job = await prisma.crawlJob.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const productCount = await prisma.product.count({
      where: { crawlJobId: jobId },
    });

    return NextResponse.json({ ...job, productCount });
  }

  // 전체 목록
  const jobs = await prisma.crawlJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ jobs });
}
