import { getAdminBanners } from "@/lib/queries";
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
import { BannerForm } from "@/components/admin/banner-form";
import { BannerActions } from "@/components/admin/banner-actions";

export default async function AdminBannersPage() {
  const banners = await getAdminBanners();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">배너 관리</h1>
        <Badge variant="outline">{banners.length}개 배너</Badge>
      </div>

      <BannerForm />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>위치</TableHead>
                <TableHead>정렬순서</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>기간</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{banner.title}</p>
                    {banner.subtitle && (
                      <p className="text-[10px] text-gray-400">{banner.subtitle}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {banner.position}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{banner.sortOrder}</TableCell>
                  <TableCell>
                    <Badge
                      className={`text-[10px] ${
                        banner.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {banner.isActive ? "활성" : "비활성"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {banner.startsAt
                      ? `${banner.startsAt.toLocaleDateString("ko-KR")} ~ ${banner.endsAt?.toLocaleDateString("ko-KR") ?? "무기한"}`
                      : "상시"}
                  </TableCell>
                  <TableCell>
                    <BannerActions bannerId={banner.id} isActive={banner.isActive} />
                  </TableCell>
                </TableRow>
              ))}
              {banners.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                    배너가 없습니다.
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
