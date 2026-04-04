"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCrawler } from "@/lib/crawler";
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

/** 새 크롤링 작업 생성 및 실행 */
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

    // 1) CrawlJob 생성 (PENDING)
    const job = await prisma.crawlJob.create({
      data: {
        sourceSite,
        targetUrl,
        status: "PENDING",
      },
    });

    // 2) 크롤링 실행 (비동기 시작 → 즉시 RUNNING 상태로)
    await prisma.crawlJob.update({
      where: { id: job.id },
      data: { status: "RUNNING", startedAt: new Date() },
    });

    // 3) 크롤러 실행
    try {
      const crawler = getCrawler(sourceSite);
      const result = await crawler.crawl({
        sourceSite,
        targetUrl,
        maxItems,
        delayMs: 800,
      });

      // 4) 크롤링된 상품을 DB로 임포트
      const importResult = await importCrawledProducts(result.products, job.id);

      // 5) 작업 완료 업데이트
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

      revalidatePath("/admin/crawl");
      return {
        success: true,
        jobId: job.id,
      };
    } catch (crawlError: any) {
      // 크롤링 실패
      await prisma.crawlJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          errorLog: crawlError.message,
          completedAt: new Date(),
        },
      });

      revalidatePath("/admin/crawl");
      return { error: `크롤링 실패: ${crawlError.message}`, jobId: job.id };
    }
  } catch (e: any) {
    return { error: e.message || "크롤링 작업 생성에 실패했습니다." };
  }
}

/** 크롤링 작업 취소 */
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

/** 크롤링된 상품 일괄 승인 (DRAFT → ACTIVE) */
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

/** 크롤링된 상품 일괄 삭제 */
export async function deleteCrawledProducts(crawlJobId: string) {
  try {
    await requireAdmin();

    // 이미지/변형 먼저 삭제
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

/** 크롤링 작업 삭제 */
export async function deleteCrawlJob(jobId: string) {
  try {
    await requireAdmin();

    // 연관 상품이 있는지 확인
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
