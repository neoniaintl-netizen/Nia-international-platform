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
import { CategoryForm } from "@/components/admin/category-form";
import { CategoryActions } from "@/components/admin/category-actions";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { depth: 0 },
    orderBy: { sortOrder: "asc" },
    include: {
      children: {
        orderBy: { sortOrder: "asc" },
        include: {
          _count: { select: { products: true } },
          children: {
            orderBy: { sortOrder: "asc" },
            include: { _count: { select: { products: true } } },
          },
        },
      },
      _count: { select: { products: true } },
    },
  });

  const totalCategories = categories.reduce(
    (acc, cat) => acc + 1 + cat.children.reduce((a, c) => a + 1 + (c.children?.length ?? 0), 0),
    0
  );

  // Flatten for parent selection in form
  const parentCategories = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">카테고리 관리</h1>
        <div className="flex items-center gap-3">
          <Badge variant="outline">{totalCategories}개 카테고리</Badge>
          <CategoryForm parentCategories={parentCategories} />
        </div>
      </div>

      {/* Category list */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>카테고리명</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>깊이</TableHead>
                <TableHead className="text-right">상품 수</TableHead>
                <TableHead>정렬</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <>
                  {/* Parent category */}
                  <TableRow key={cat.id} className="bg-gray-50/50">
                    <TableCell className="text-sm font-bold">{cat.name}</TableCell>
                    <TableCell className="text-xs text-gray-400 font-mono">{cat.slug}</TableCell>
                    <TableCell>
                      <Badge className="text-[10px] bg-blue-100 text-blue-700">대분류</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-right">{cat._count.products}</TableCell>
                    <TableCell className="text-xs text-gray-400">{cat.sortOrder}</TableCell>
                    <TableCell>
                      <CategoryActions
                        categoryId={cat.id}
                        hasProducts={cat._count.products > 0}
                        hasChildren={cat.children.length > 0}
                      />
                    </TableCell>
                  </TableRow>
                  {/* Child categories */}
                  {cat.children.map((child) => (
                    <>
                      <TableRow key={child.id}>
                        <TableCell className="text-sm pl-8">
                          <span className="text-gray-300 mr-1">ㄴ</span> {child.name}
                        </TableCell>
                        <TableCell className="text-xs text-gray-400 font-mono">{child.slug}</TableCell>
                        <TableCell>
                          <Badge className="text-[10px] bg-green-100 text-green-700">중분류</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-right">{child._count.products}</TableCell>
                        <TableCell className="text-xs text-gray-400">{child.sortOrder}</TableCell>
                        <TableCell>
                          <CategoryActions
                            categoryId={child.id}
                            hasProducts={child._count.products > 0}
                            hasChildren={(child.children?.length ?? 0) > 0}
                          />
                        </TableCell>
                      </TableRow>
                      {/* Grandchild categories */}
                      {child.children?.map((grandchild) => (
                        <TableRow key={grandchild.id}>
                          <TableCell className="text-sm pl-16">
                            <span className="text-gray-300 mr-1">ㄴ</span> {grandchild.name}
                          </TableCell>
                          <TableCell className="text-xs text-gray-400 font-mono">{grandchild.slug}</TableCell>
                          <TableCell>
                            <Badge className="text-[10px] bg-yellow-100 text-yellow-700">소분류</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-right">{grandchild._count.products}</TableCell>
                          <TableCell className="text-xs text-gray-400">{grandchild.sortOrder}</TableCell>
                          <TableCell>
                            <CategoryActions
                              categoryId={grandchild.id}
                              hasProducts={grandchild._count.products > 0}
                              hasChildren={false}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ))}
                </>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
