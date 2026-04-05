"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCrawler, detectSite } from "@/lib/crawler";
import { importCrawledProducts } from "@/lib/crawler/product-importer";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다.");
  }
  return session.user.id;
}

// ─── 백그라운드 크롤 실행 (fire-and-forget) ───

async function runCrawlInBackground(
  jobId: string,
  sourceSite: string,
  targetUrl: string,
  maxItems: number
) {
  try {
    const crawler = getCrawler(sourceSite);
    const result = await crawler.crawl({
      sourceSite,
      targetUrl,
      maxItems,
      delayMs: 800,
    });

    const importResult = await importCrawledProducts(result.products, jobId);

    const allErrors = [...result.errors, ...importResult.errors];
    await prisma.crawlJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        totalItems: result.totalItems,
        successItems: importResult.imported,
        failedItems: result.failedItems + importResult.errors.length,
        errorLog: allErrors.length > 0 ? allErrors.join("\n").slice(0, 5000) : null,
        completedAt: new Date(),
      },
    });
  } catch (crawlError: any) {
    await prisma.crawlJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorLog: (crawlError.message || "Unknown error").slice(0, 5000),
        completedAt: new Date(),
      },
    });
  }
}

// ─── 배치 크롤링 (비동기) ───

export async function startCrawlJob(
  _prevState: { success?: boolean; error?: string; jobId?: string } | null,
  formData: FormData
) {
  try {
    await requireAdmin();

    const sourceSite = formData.get("sourceSite") as string;
    const targetUrl = formData.get("targetUrl") as string;
    const maxItems = parseInt(formData.get("maxItems") as string, 10) || 50;

    if (!sourceSite || !targetUrl) {
      return { error: "사이트와 URL을 입력해주세요." };
    }

    // Job 생성 → RUNNING 상태로 즉시 전환
    const job = await prisma.crawlJob.create({
      data: {
        sourceSite,
        targetUrl,
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    // 백그라운드에서 크롤링 실행 (await 하지 않음)
    void runCrawlInBackground(job.id, sourceSite, targetUrl, maxItems);

    revalidatePath("/admin/crawl");
    return {
      success: true,
      jobId: job.id,
    };
  } catch (e: any) {
    return { error: e.message || "크롤링 작업 생성에 실패했습니다." };
  }
}

// ─── 단일 상품 크롤 (즉시) ───

export async function crawlSingleProduct(
  _prevState: { success?: boolean; error?: string; productName?: string } | null,
  formData: FormData
) {
  try {
    await requireAdmin();

    const url = (formData.get("url") as string)?.trim();
    if (!url) {
      return { error: "상품 URL을 입력해주세요." };
    }

    const sourceSite = detectSite(url);
    const crawler = getCrawler(sourceSite);

    // HTML 가져오기
    const html = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(15_000),
    }).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    });

    // 상세 페이지 파싱
    const product = crawler.parseProductDetail(html, url);
    if (!product) {
      return { error: "상품 정보를 추출하지 못했습니다. URL을 확인해주세요." };
    }

    // DB에 임포트
    const result = await importCrawledProducts([product], "");
    if (result.imported === 0) {
      if (result.skipped > 0) {
        return { error: "이미 등록된 상품입니다." };
      }
      return { error: `등록 실패: ${result.errors.join(", ")}` };
    }

    revalidatePath("/admin/crawl");
    revalidatePath("/admin/products");
    return {
      success: true,
      productName: product.name,
    };
  } catch (e: any) {
    return { error: e.message || "상품 크롤링에 실패했습니다." };
  }
}

// ─── 작업 관리 ───

export async function cancelCrawlJob(jobId: string) {
  try {
    await requireAdmin();

    await prisma.crawlJob.update({
      where: { id: jobId },
      data: {
        status: "CANCELLED",
        completedAt: new Date(),
      },
    });

    revalidatePath("/admin/crawl");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function approveCrawledProducts(crawlJobId: string) {
  try {
    await requireAdmin();

    const result = await prisma.product.updateMany({
      where: { crawlJobId, status: "DRAFT" },
      data: { status: "ACTIVE" },
    });

    revalidatePath("/admin/crawl");
    revalidatePath("/products");
    return { success: true, count: result.count };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteCrawledProducts(crawlJobId: string) {
  try {
    await requireAdmin();

    const products = await prisma.product.findMany({
      where: { crawlJobId },
      select: { id: true },
    });
    const productIds = products.map((p) => p.id);

    if (productIds.length > 0) {
      await prisma.productImage.deleteMany({
        where: { productId: { in: productIds } },
      });
      await prisma.productVariant.deleteMany({
        where: { productId: { in: productIds } },
      });
      await prisma.product.deleteMany({
        where: { id: { in: productIds } },
      });
    }

    revalidatePath("/admin/crawl");
    return { success: true, count: productIds.length };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteCrawlJob(jobId: string) {
  try {
    await requireAdmin();

    const productCount = await prisma.product.count({
      where: { crawlJobId: jobId },
    });

    if (productCount > 0) {
      return { error: `${productCount}개의 연관 상품이 있습니다. 상품을 먼저 삭제해주세요.` };
    }

    await prisma.crawlJob.delete({ where: { id: jobId } });

    revalidatePath("/admin/crawl");
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}
