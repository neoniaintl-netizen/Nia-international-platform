import { getAdminProducts } from "@/lib/queries";
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
import { ProductStatusActions } from "@/components/admin/product-status-actions";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "검수대기", cls: "bg-yellow-100 text-yellow-700" },
  ACTIVE: { label: "판매중", cls: "bg-green-100 text-green-700" },
  SOLDOUT: { label: "품절", cls: "bg-gray-100 text-gray-600" },
  HIDDEN: { label: "숨김", cls: "bg-gray-100 text-gray-500" },
  ARCHIVED: { label: "보관", cls: "bg-gray-100 text-gray-400" },
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const limit = 20;
  const { products, total } = await getAdminProducts({
    status: params.status,
    search: params.search,
    limit,
    offset: (page - 1) * limit,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">상품 관리</h1>
        <Badge variant="outline">{total}개 상품</Badge>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "", label: "전체" },
          { key: "ACTIVE", label: "판매중" },
          { key: "DRAFT", label: "검수대기" },
          { key: "SOLDOUT", label: "품절" },
          { key: "HIDDEN", label: "숨김" },
        ].map((f) => (
          <a
            key={f.key}
            href={`/admin/products${f.key ? `?status=${f.key}` : ""}`}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              (params.status ?? "") === f.key
                ? "bg-black text-white border-black"
                : "hover:bg-gray-50"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">상품명</TableHead>
                <TableHead>브랜드</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead className="text-right">원가</TableHead>
                <TableHead className="text-right">할인가</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">변형/이미지</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const st = STATUS_MAP[p.status] ?? { label: p.status, cls: "" };
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="text-sm font-medium truncate max-w-[280px]">{p.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{p.slug}</p>
                    </TableCell>
                    <TableCell className="text-sm">{p.brand.name}</TableCell>
                    <TableCell className="text-sm text-gray-500">{p.category.name}</TableCell>
                    <TableCell className="text-sm text-right">
                      {p.originalPrice.toLocaleString()}원
                    </TableCell>
                    <TableCell className="text-sm text-right text-red-500">
                      {p.salePrice ? `${p.salePrice.toLocaleString()}원` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${st.cls}`}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 text-right">
                      {p._count.variants}개 / {p._count.images}장
                    </TableCell>
                    <TableCell>
                      <ProductStatusActions productId={p.id} currentStatus={p.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                    상품이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/admin/products?page=${p}${params.status ? `&status=${params.status}` : ""}`}
              className={`px-3 py-1 text-sm rounded border ${
                p === page ? "bg-black text-white" : "hover:bg-gray-50"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
