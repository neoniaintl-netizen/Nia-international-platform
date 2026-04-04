import { getAllBrands } from "@/lib/queries";
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
import { BrandForm } from "@/components/admin/brand-form";
import { BrandActions } from "@/components/admin/brand-actions";

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">브랜드 관리</h1>
        <Badge variant="outline">{brands.length}개 브랜드</Badge>
      </div>

      {/* Add brand form */}
      <BrandForm />

      {/* Brand list */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>브랜드명</TableHead>
                <TableHead>한글명</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">상품 수</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="text-sm font-medium">{brand.name}</TableCell>
                  <TableCell className="text-sm text-gray-500">{brand.nameKo || "-"}</TableCell>
                  <TableCell className="text-xs text-gray-400 font-mono">{brand.slug}</TableCell>
                  <TableCell className="text-sm text-right">{brand._count.products}</TableCell>
                  <TableCell>
                    <Badge
                      className={`text-[10px] ${
                        brand.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {brand.isActive ? "활성" : "비활성"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <BrandActions
                      brandId={brand.id}
                      hasProducts={brand._count.products > 0}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
