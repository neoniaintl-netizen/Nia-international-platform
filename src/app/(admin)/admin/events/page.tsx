import Link from "next/link";
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
import { EventForm } from "@/components/admin/event-form";
import { EventActions } from "@/components/admin/event-actions";
import { Eye, ExternalLink } from "lucide-react";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">기획전 관리</h1>
        <Badge variant="outline">{events.length}개 기획전</Badge>
      </div>

      <EventForm />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>상품</TableHead>
                <TableHead>조회</TableHead>
                <TableHead>기간</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{e.title}</p>
                    {e.subtitle && (
                      <p className="text-[10px] text-gray-400">{e.subtitle}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/events/${e.slug}`}
                      target="_blank"
                      className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      {e.slug}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{e._count.products}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {e.viewCount}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] text-gray-500">
                      {e.startsAt?.toISOString().split("T")[0] ?? "즉시"} ~{" "}
                      {e.endsAt?.toISOString().split("T")[0] ?? "무기한"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        e.isPublished
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }
                    >
                      {e.isPublished ? "공개" : "비공개"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <EventActions
                      eventId={e.id}
                      isPublished={e.isPublished}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {events.length === 0 && (
            <div className="text-center py-12 text-sm text-gray-400">
              등록된 기획전이 없습니다. 위 폼에서 새 기획전을 만들어보세요.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
