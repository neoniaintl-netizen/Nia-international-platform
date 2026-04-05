import { getCrawlJobs, getCrawlJobStats } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bug,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
} from "lucide-react";
import { CrawlForm, QuickProductCrawl } from "@/components/admin/crawl-form";
import { CrawlJobActions } from "@/components/admin/crawl-job-actions";
import { CrawlAutoRefresh } from "@/components/admin/crawl-auto-refresh";

export default async function CrawlPage() {
  const [{ jobs, total }, stats] = await Promise.all([
    getCrawlJobs(),
    getCrawlJobStats(),
  ]);

  const hasRunning = jobs.some((j) => j.status === "RUNNING" || j.status === "PENDING");

  return (
    <div className="space-y-6">
      {/* 자동 새로고침 (RUNNING 작업이 있을 때) */}
      {hasRunning && <CrawlAutoRefresh />}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">크롤링 관리</h1>
        <Badge variant="outline">{total}건의 작업</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="전체" value={stats.total} icon={Bug} />
        <StatCard label="실행 중" value={stats.running} icon={PlayCircle} color="blue" />
        <StatCard label="완료" value={stats.completed} icon={CheckCircle2} color="green" />
        <StatCard label="실패" value={stats.failed} icon={XCircle} color="red" />
        <StatCard label="대기" value={stats.pending} icon={Clock} color="yellow" />
        <StatCard label="수집 상품" value={stats.totalProducts} icon={Package} color="purple" />
      </div>

      {/* 빠른 상품 추가 */}
      <QuickProductCrawl />

      {/* 배치 크롤링 */}
      <CrawlForm />

      {/* Job list */}
      <section>
        <h2 className="font-bold mb-4">크롤링 작업 내역</h2>
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-400">
              <Bug className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p>크롤링 작업이 없습니다.</p>
              <p className="text-xs mt-1">위 폼에서 새 크롤링을 시작해보세요.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={job.status} />
                        <span className="font-medium text-sm">{job.sourceSite}</span>
                      </div>
                      {job.targetUrl && (
                        <p className="text-xs text-gray-400 truncate">{job.targetUrl}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>전체: {job.totalItems}</span>
                        <span className="text-green-600">성공: {job.successItems}</span>
                        <span className="text-red-500">실패: {job.failedItems}</span>
                        <span>
                          {job.createdAt.toLocaleString("ko-KR")}
                        </span>
                        {job.completedAt && job.startedAt && (
                          <span>
                            소요: {Math.round(
                              (job.completedAt.getTime() - job.startedAt.getTime()) / 1000
                            )}초
                          </span>
                        )}
                      </div>
                      {job.errorLog && (
                        <details className="mt-2">
                          <summary className="text-xs text-red-400 cursor-pointer">
                            에러 로그 보기
                          </summary>
                          <pre className="mt-1 text-[10px] text-red-400 bg-red-50 p-2 rounded max-h-32 overflow-auto whitespace-pre-wrap">
                            {job.errorLog}
                          </pre>
                        </details>
                      )}
                    </div>
                    <CrawlJobActions jobId={job.id} status={job.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    red: "text-red-500 bg-red-50",
    yellow: "text-yellow-600 bg-yellow-50",
    purple: "text-purple-600 bg-purple-50",
  };
  const cls = color ? colorMap[color] : "text-gray-600 bg-gray-50";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cls}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "대기", cls: "bg-gray-100 text-gray-600" },
    RUNNING: { label: "실행 중", cls: "bg-blue-100 text-blue-700" },
    COMPLETED: { label: "완료", cls: "bg-green-100 text-green-700" },
    FAILED: { label: "실패", cls: "bg-red-100 text-red-700" },
    CANCELLED: { label: "취소됨", cls: "bg-gray-100 text-gray-500" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "" };
  return <Badge className={`text-[10px] ${cls}`}>{label}</Badge>;
}
