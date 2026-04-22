import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RepairStatusSelect } from "@/components/admin/repair-status-select";

const STATUS_LABEL: Record<string, string> = {
  RECEIVED: "접수",
  INSPECTING: "검수중",
  QUOTED: "견적 발송",
  IN_PROGRESS: "수선중",
  SHIPPING: "반송중",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

export default async function AdminRepairsPage() {
  const repairs = await prisma.repairRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, phone: true } },
    },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">수선 관리</h1>
        <Badge variant="outline">{repairs.length}건</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>접수번호</TableHead>
                <TableHead>고객</TableHead>
                <TableHead>상품</TableHead>
                <TableHead>요청 내용</TableHead>
                <TableHead>접수일</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repairs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">
                    {r.requestNumber}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{r.user.name ?? "-"}</p>
                    <p className="text-[11px] text-gray-400">{r.user.email}</p>
                    {r.user.phone && (
                      <p className="text-[11px] text-gray-400">
                        {r.user.phone}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.brandName && (
                      <p className="text-[11px] text-gray-400">{r.brandName}</p>
                    )}
                    <p className="text-sm">{r.productName}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs line-clamp-3 max-w-xs">{r.issue}</p>
                  </TableCell>
                  <TableCell className="text-xs">
                    {r.createdAt.toISOString().split("T")[0]}
                  </TableCell>
                  <TableCell>
                    <RepairStatusSelect
                      id={r.id}
                      currentStatus={r.status}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {repairs.length === 0 && (
            <div className="text-center py-12 text-sm text-gray-400">
              접수된 수선 요청이 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
