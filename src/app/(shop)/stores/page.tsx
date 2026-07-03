import type { Metadata } from "next";

export const metadata: Metadata = { title: "오프라인 스토어" };

const STORES = [
  {
    name: "NOVAREN 스토어",
    type: "본사 직영",
    address: "서울특별시 강남구 논현로102길 5(역삼동) 4층",
    hours: "평일 10:00 - 19:00",
    phone: "1544-7199",
    description: "NOVAREN 본사 직영 매장. 골프웨어, 스포츠, 여성의류 전 카테고리 취급.",
  },
];

export default function StoresPage() {
  return (
    <div className="max-w-[960px] mx-auto px-4 lg:px-6 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-2">오프라인 스토어</h1>
      <p className="text-sm text-gray-500 mb-8">
        NOVAREN 오프라인 매장에서 직접 상품을 경험해보세요.
      </p>

      <div className="space-y-4">
        {STORES.map((store) => (
          <div
            key={store.name}
            className="border rounded-xl p-5 hover:border-black transition-colors"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900">
                    {store.name}
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    {store.type}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{store.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-500">
              <div className="flex items-start gap-2">
                <span className="text-gray-400 shrink-0">주소</span>
                <span>{store.address}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-400 shrink-0">영업</span>
                <span>{store.hours}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-400 shrink-0">전화</span>
                <span>{store.phone}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
