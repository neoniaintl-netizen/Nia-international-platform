import type { Metadata } from "next";

export const metadata: Metadata = { title: "오프라인 스토어" };

const STORES = [
  {
    name: "NOVAREN 스토어",
    type: "플래그십",
    address: "서울특별시 강남구 논현로102길 5(역삼동) 4층",
    hours: "평일 10:00 - 19:00",
    phone: "1544-7199",
    description: "NOVAREN 본사 직영 매장. 골프웨어, 스포츠, 여성의류 전 카테고리 취급.",
  },
  {
    name: "NOVAREN 스탠다드",
    type: "직영",
    address: "서울특별시 성동구 왕십리로 83-21",
    hours: "매일 11:00 - 21:00",
    phone: "02-0000-0001",
    description: "NOVAREN 자체 브랜드 및 큐레이션 상품 전문 매장.",
  },
  {
    name: "NOVAREN 엠프티",
    type: "편집숍",
    address: "서울특별시 마포구 양화로 188",
    hours: "매일 11:00 - 22:00",
    phone: "02-0000-0002",
    description: "신진 디자이너 브랜드 및 한정판 상품을 만나볼 수 있는 편집숍.",
  },
  {
    name: "NOVAREN 스퀘어",
    type: "복합문화",
    address: "서울특별시 영등포구 여의대로 108",
    hours: "매일 10:30 - 22:00",
    phone: "02-0000-0003",
    description: "패션, 라이프스타일, F&B가 결합된 복합 문화 공간.",
  },
  {
    name: "NOVAREN 테라스",
    type: "직영",
    address: "경기도 성남시 분당구 판교역로 235",
    hours: "매일 11:00 - 21:00",
    phone: "031-000-0004",
    description: "판교 테크노밸리 인근 프리미엄 패션 매장.",
  },
  {
    name: "아즈니섬",
    type: "부티크",
    address: "서울특별시 강남구 압구정로 461",
    hours: "매일 12:00 - 20:00",
    phone: "02-0000-0005",
    description: "프리미엄 골프웨어 및 럭셔리 브랜드 부티크.",
  },
  {
    name: "NOVAREN 골프",
    type: "전문매장",
    address: "경기도 용인시 기흥구 신갈로 12",
    hours: "매일 09:00 - 21:00",
    phone: "031-000-0006",
    description: "골프 의류, 용품, 장비를 한곳에서. 피팅 서비스 운영.",
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
