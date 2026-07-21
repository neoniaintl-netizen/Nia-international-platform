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
import { LookbookForm } from "@/components/admin/lookbook-form";
import { LookbookActions } from "@/components/admin/lookbook-actions";
import { Eye, ExternalLink } from "lucide-react";

export default async function AdminLookbooksPage() {
  const lookbooks = await prisma.lookbook.findMany({
    where: { kind: null }, // 추천 코디(OUTFIT)는 /admin/outfits 에서 관리
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      brand: { select: { name: true } },
      _count: { select: { products: true, images: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">룩북 관리</h1>
        <Badge variant="outline">{lookbooks.length}개 룩북</Badge>
      </div>

      <LookbookForm />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>시즌</TableHead>
                <TableHead>성별</TableHead>
                <TableHead>브랜드</TableHead>
                <TableHead>상품/이미지</TableHead>
                <TableHead>조회</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lookbooks.map((lb) => (
                <TableRow key={lb.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{lb.title}</p>
                    <Link
                      href={`/lookbook/${lb.slug}`}
                      target="_blank"
                      className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      {lb.slug}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      {lb.season ?? "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {lb.gender ?? "ALL"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {lb.brand?.name ?? "-"}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-gray-500">
                      🛍 {lb._count.products} · 🖼 {lb._count.images}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {lb.viewCount}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        lb.isPublished
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }
                    >
                      {lb.isPublished ? "공개" : "비공개"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <LookbookActions
                      id={lb.id}
                      isPublished={lb.isPublished}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {lookbooks.length === 0 && (
            <div className="text-center py-12 text-sm text-gray-400">
              등록된 룩북이 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
