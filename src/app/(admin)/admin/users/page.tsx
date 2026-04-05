import { getAdminUsers } from "@/lib/queries";
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
import { UserRoleSelect } from "@/components/admin/user-role-select";

const ROLE_MAP: Record<string, { label: string; cls: string }> = {
  CUSTOMER: { label: "회원", cls: "bg-gray-100 text-gray-600" },
  ADMIN: { label: "관리자", cls: "bg-blue-100 text-blue-700" },
  SELLER: { label: "판매자", cls: "bg-green-100 text-green-700" },
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const limit = 20;
  const { users, total } = await getAdminUsers({
    role: params.role,
    search: params.search,
    limit,
    offset: (page - 1) * limit,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">회원 관리</h1>
        <Badge variant="outline">{total}명</Badge>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "", label: "전체" },
          { key: "CUSTOMER", label: "회원" },
          { key: "ADMIN", label: "관리자" },
          { key: "SELLER", label: "판매자" },
        ].map((f) => (
          <a
            key={f.key}
            href={`/admin/users${f.key ? `?role=${f.key}` : ""}`}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              (params.role ?? "") === f.key
                ? "bg-black text-white border-black"
                : "hover:bg-gray-50"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이메일</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>닉네임</TableHead>
                <TableHead>역할</TableHead>
                <TableHead className="text-right">주문</TableHead>
                <TableHead className="text-right">리뷰</TableHead>
                <TableHead>가입일</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const role = ROLE_MAP[user.role] ?? { label: user.role, cls: "" };
                return (
                  <TableRow key={user.id}>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell className="text-sm">{user.name || "-"}</TableCell>
                    <TableCell className="text-sm text-gray-500">{user.nickname || "-"}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${role.cls}`}>{role.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-right">{user._count.orders}</TableCell>
                    <TableCell className="text-sm text-right">{user._count.reviews}</TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {user.createdAt.toLocaleDateString("ko-KR")}
                    </TableCell>
                    <TableCell>
                      <UserRoleSelect userId={user.id} currentRole={user.role} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                    회원이 없습니다.
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
