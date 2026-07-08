-- AlterTable: 크롤 알림 경고 플래그 (수집 0건/전일대비 급감)
ALTER TABLE "crawl_jobs" ADD COLUMN "warning" TEXT;
