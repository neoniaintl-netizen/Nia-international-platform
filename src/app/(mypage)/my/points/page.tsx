import { auth } from "@/lib/auth";
import { getUserPoints, getPointHistory } from "@/lib/queries";
import { redirect } from "next/navigation";
import { Coins, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function PointsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/my/points");

  const [totalPoints, history] = await Promise.all([
    getUserPoints(session.user.id),
    getPointHistory(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">적립금</h1>

      {/* Balance card */}
      <Card className="bg-black text-white">
        <CardContent className="py-6">
          <p className="text-sm text-white/60">보유 적립금</p>
          <p className="text-3xl font-bold mt-1">{totalPoints.toLocaleString()}원</p>
          <p className="text-xs text-white/40 mt-2">적립금은 1원 단위로 사용 가능합니다</p>
        </CardContent>
      </Card>

      {/* History */}
      <section>
        <h2 className="font-bold mb-4">적립금 내역</h2>
        {history.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Coins className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">적립금 내역이 없습니다</p>
              <p className="text-xs text-gray-400 mt-1">상품 구매 시 적립금이 쌓입니다</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1">
            {history.map((item) => {
              const isEarn = item.amount > 0;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isEarn ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                    }`}>
                      {isEarn ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.description}</p>
                      <p className="text-[10px] text-gray-400">
                        {item.createdAt.toLocaleDateString("ko-KR")} · 잔액 {item.balance.toLocaleString()}원
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${isEarn ? "text-green-600" : "text-red-500"}`}>
                    {isEarn ? "+" : ""}{item.amount.toLocaleString()}원
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
