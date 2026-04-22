import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Plus, Wrench } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  RECEIVED: "접수",
  INSPECTING: "검수중",
  QUOTED: "견적 발송",
  IN_PROGRESS: "수선중",
  SHIPPING: "반송중",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

const STATUS_COLOR: Record<string, string> = {
  RECEIVED: "bg-gray-100 text-gray-700",
  INSPECTING: "bg-blue-50 text-blue-700",
  QUOTED: "bg-amber-50 text-amber-700",
  IN_PROGRESS: "bg-indigo-50 text-indigo-700",
  SHIPPING: "bg-teal-50 text-teal-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELLED: "bg-gray-50 text-gray-400",
};

export default async function RepairListPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/my/repair");

  const repairs = await prisma.repairRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-black">수선 진행조회</h1>
          <p className="text-xs text-gray-500 mt-1">
            접수한 수선 요청의 진행 상태를 확인할 수 있습니다
          </p>
        </div>
        <Link
          href="/my/repair/new"
          className="inline-flex items-center gap-1 bg-black text-white px-4 h-10 rounded-full text-xs font-bold hover:bg-gray-800"
        >
          <Plus className="w-3 h-3" />
          신청
        </Link>
      </div>

      {repairs.length === 0 ? (
        <div className="text-center py-20 border rounded-xl">
          <Wrench className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-1">
            접수한 수선 요청이 없습니다
          </p>
          <p className="text-xs text-gray-400 mb-5">
            구매하신 상품의 수선이 필요하신가요?
          </p>
          <Link
            href="/my/repair/new"
            className="inline-flex items-center gap-1 bg-black text-white px-5 h-10 rounded-full text-xs font-bold"
          >
            수선 신청하기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {repairs.map((r) => (
            <div
              key={r.id}
              className="border rounded-xl p-5 hover:border-gray-400 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge
                    className={`${STATUS_COLOR[r.status] ?? "bg-gray-100"} rounded-full px-2.5 py-0.5 text-[10px] font-bold`}
                  >
                    {STATUS_LABEL[r.status]}
                  </Badge>
                  <span className="text-[11px] text-gray-400">
                    {r.requestNumber}
                  </span>
                </div>
                <span className="text-[11px] text-gray-400">
                  {r.createdAt.toISOString().split("T")[0]}
                </span>
              </div>

              {r.brandName && (
                <p className="text-xs font-bold text-gray-900">{r.brandName}</p>
              )}
              <p className="text-sm mb-2">{r.productName}</p>
              <p className="text-xs text-gray-500 line-clamp-2">{r.issue}</p>

              {r.estimatedCost != null && (
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                  <span className="text-gray-500">예상 수선비</span>
                  <span className="font-bold">
                    {r.estimatedCost.toLocaleString()}원
                  </span>
                </div>
              )}
              {r.finalCost != null && (
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-gray-500">확정 비용</span>
                  <span className="font-bold">
                    {r.finalCost.toLocaleString()}원
                  </span>
                </div>
              )}

              {r.deliveryNumber && (
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                  <span className="text-gray-500">반송 조회</span>
                  <span className="font-semibold">
                    {r.deliveryCarrier} {r.deliveryNumber}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-gray-50 rounded-xl p-5 text-xs text-gray-600 leading-relaxed">
        <p className="font-bold text-gray-900 mb-2">수선 안내</p>
        <ul className="space-y-1">
          <li>• 수선 접수 후 2영업일 이내에 담당자가 연락드립니다.</li>
          <li>• 상품 확인 후 견적을 안내하며, 승인 시 수선이 진행됩니다.</li>
          <li>• 수선 기간은 통상 7~14일이 소요됩니다.</li>
          <li>• 문의: 고객센터 1544-7199</li>
        </ul>
      </div>
    </div>
  );
}
