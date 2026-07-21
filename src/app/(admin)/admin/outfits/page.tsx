import Link from "next/link";
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
import { getAdminOutfits } from "@/lib/queries";
import { OutfitCreateForm } from "@/components/admin/outfit-create-form";
import { OutfitRowActions } from "@/components/admin/outfit-row-actions";
import { ExternalLink } from "lucide-react";

export default async function AdminOutfitsPage() {
  const outfits = await getAdminOutfits();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">추천 코디 관리</h1>
        <Badge variant="outline">{outfits.length}개 코디</Badge>
      </div>

      <OutfitCreateForm />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>slug</TableHead>
                <TableHead className="text-right">아이템</TableHead>
                <TableHead>공개</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outfits.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="text-sm font-medium">
                    <Link href={`/admin/outfits/${o.id}`} className="hover:underline">
                      {o.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-gray-400">{o.slug}</TableCell>
                  <TableCell className="text-sm text-right">{o._count.products}</TableCell>
                  <TableCell>
                    {o.isPublished ? (
                      <Badge className="text-[10px] bg-green-100 text-green-700">공개</Badge>
                    ) : (
                      <Badge className="text-[10px] bg-gray-100 text-gray-500">비공개</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/outfits/${o.id}`}
                        className="text-xs border rounded px-2 py-1 hover:bg-gray-50"
                      >
                        아이템 편집
                      </Link>
                      {o.isPublished && (
                        <Link
                          href={`/outfits/${o.slug}`}
                          target="_blank"
                          className="text-gray-400 hover:text-black"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                      <OutfitRowActions id={o.id} isPublished={o.isPublished} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {outfits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                    아직 코디가 없습니다. 위에서 새 코디를 만들어보세요.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
