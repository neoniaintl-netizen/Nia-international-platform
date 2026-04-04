import { Star } from "lucide-react";

export function ReviewStats({
  total,
  avg,
  distribution,
}: {
  total: number;
  avg: number;
  distribution: number[]; // [1star, 2star, 3star, 4star, 5star]
}) {
  if (total === 0) return null;

  return (
    <div className="flex items-center gap-8 p-5 bg-gray-50 rounded-xl mb-6">
      {/* Average score */}
      <div className="text-center shrink-0">
        <p className="text-4xl font-bold">{avg.toFixed(1)}</p>
        <div className="flex justify-center mt-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`w-4 h-4 ${
                s <= Math.round(avg) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">{total}개 리뷰</p>
      </div>

      {/* Distribution bars */}
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star - 1];
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-4 text-gray-500 text-right">{star}</span>
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 shrink-0" />
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 text-gray-400 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
