import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Plus, Wrench } from "lucide-react";
import { getTranslations } from "next-intl/server";

const STATUS_KEY: Record<string, string> = {
  RECEIVED: "rpReceived",
  INSPECTING: "rpInspecting",
  QUOTED: "rpQuoted",
  IN_PROGRESS: "rpInProgress",
  SHIPPING: "rpShipping",
  COMPLETED: "rpCompleted",
  CANCELLED: "rpCancelled",
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
  const t = await getTranslations("Mypage");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-black">{t("repairTitle")}</h1>
          <p className="text-xs text-gray-500 mt-1">
            {t("repairDesc")}
          </p>
        </div>
        <Link
          href="/my/repair/new"
          className="inline-flex items-center gap-1 bg-black text-white px-4 h-10 rounded-full text-xs font-bold hover:bg-gray-800"
        >
          <Plus className="w-3 h-3" />
          {t("apply")}
        </Link>
      </div>

      {repairs.length === 0 ? (
        <div className="text-center py-20 border rounded-xl">
          <Wrench className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-1">
            {t("noRepairs")}
          </p>
          <p className="text-xs text-gray-400 mb-5">
            {t("noRepairsHint")}
          </p>
          <Link
            href="/my/repair/new"
            className="inline-flex items-center gap-1 bg-black text-white px-5 h-10 rounded-full text-xs font-bold"
          >
            {t("applyRepair")}
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
                    {STATUS_KEY[r.status] ? t(STATUS_KEY[r.status]) : r.status}
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
                  <span className="text-gray-500">{t("estimatedCost")}</span>
                  <span className="font-bold">
                    {r.estimatedCost.toLocaleString()}원
                  </span>
                </div>
              )}
              {r.finalCost != null && (
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-gray-500">{t("finalCost")}</span>
                  <span className="font-bold">
                    {r.finalCost.toLocaleString()}원
                  </span>
                </div>
              )}

              {r.deliveryNumber && (
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                  <span className="text-gray-500">{t("returnTracking")}</span>
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
        <p className="font-bold text-gray-900 mb-2">{t("repairGuide")}</p>
        <ul className="space-y-1">
          <li>• {t("repairGuide1")}</li>
          <li>• {t("repairGuide2")}</li>
          <li>• {t("repairGuide3")}</li>
          <li>• {t("repairGuide4")}</li>
        </ul>
      </div>
    </div>
  );
}
