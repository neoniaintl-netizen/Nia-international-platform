import type { Metadata } from "next";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "회사 소개" };

const BUSINESS_AREAS = [
  {
    title: "구매대행 서비스",
    description: "한국 패션 브랜드를 중국 시장에 수출하는 구매대행 서비스. 정품 인증, 통관, 현지 배송까지 원스톱 처리.",
  },
  {
    title: "골프웨어 도소매",
    description: "프리미엄 골프웨어 브랜드의 도매 및 소매 유통. 한국 골프 패션의 중국 시장 진출을 지원.",
  },
  {
    title: "브랜드 입점 플랫폼",
    description: "중국 시장에 진출하고자 하는 한국 의류 브랜드를 위한 입점 플랫폼 운영.",
  },
  {
    title: "물류/배송",
    description: "EMS, 항공특송, 해상운송 등 다양한 배송 옵션을 통한 한-중 물류 솔루션.",
  },
  {
    title: "마케팅/홍보",
    description: "중국 현지 SNS(위챗, 샤오홍슈, 더우인) 마케팅 및 브랜드 홍보 지원.",
  },
];

const MILESTONES = [
  { year: "2022", event: "니아인터내셔널 법인 설립" },
  { year: "2023", event: "NKBUS 플랫폼 런칭" },
  { year: "2024", event: "골프웨어 카테고리 확장 · 중국 현지 물류 센터 구축" },
  { year: "2025", event: "입점 브랜드 100개 돌파 · AliPay/WeChat Pay 결제 도입" },
  { year: "2026", event: "스포츠/아웃도어/뷰티/여성의류 카테고리 오픈" },
];

export default function AboutPage() {
  return (
    <div className="max-w-[960px] mx-auto px-4 lg:px-6 py-8">
      {/* 히어로 */}
      <div className="bg-black text-white rounded-2xl p-8 md:p-12 mb-10">
        <p className="text-sm text-white/60 mb-2">About NKBUS</p>
        <h1 className="text-3xl md:text-4xl font-black mb-4">
          한국 패션의 중국 시장 진출,
          <br />
          NKBUS가 함께합니다.
        </h1>
        <p className="text-sm text-white/70 max-w-lg leading-relaxed">
          엔큐버스(NKBUS)는 한국 패션 브랜드의 중국 수출을 돕는 구매대행 플랫폼입니다.
          골프웨어, 스포츠, 여성의류 등 다양한 카테고리의 한국 브랜드를
          중국 소비자에게 연결합니다.
        </p>
      </div>

      {/* 회사 정보 */}
      <section className="mb-10">
        <h2 className="text-lg font-black text-gray-900 mb-4">회사 정보</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 rounded-xl p-6">
          {[
            ["상호명", "니아인터내셔널"],
            ["대표자", "윤지언"],
            ["설립일", "2022년"],
            ["소재지", "서울특별시 강남구 논현로102길 5(역삼동) 4층"],
            ["사업자등록번호", "291-81-0245"],
            ["대표 서비스", "NKBUS (엔큐버스)"],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-3">
              <span className="text-xs text-gray-400 shrink-0 w-24">{label}</span>
              <span className="text-sm text-gray-800">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <Separator className="mb-10" />

      {/* 사업 영역 */}
      <section className="mb-10">
        <h2 className="text-lg font-black text-gray-900 mb-4">사업 영역</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BUSINESS_AREAS.map((area) => (
            <div
              key={area.title}
              className="border rounded-xl p-5 hover:border-black transition-colors"
            >
              <h3 className="text-sm font-bold text-gray-900 mb-2">{area.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{area.description}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator className="mb-10" />

      {/* 연혁 */}
      <section className="mb-10">
        <h2 className="text-lg font-black text-gray-900 mb-4">연혁</h2>
        <div className="space-y-4">
          {MILESTONES.map((m) => (
            <div key={m.year} className="flex gap-6 items-start">
              <span className="text-lg font-black text-black shrink-0 w-16">
                {m.year}
              </span>
              <span className="text-sm text-gray-600 pt-1">{m.event}</span>
            </div>
          ))}
        </div>
      </section>

      <Separator className="mb-10" />

      {/* 비전 */}
      <section className="mb-10">
        <h2 className="text-lg font-black text-gray-900 mb-4">비전</h2>
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <p className="text-xl font-black text-gray-900 mb-3">
            &ldquo;한국 패션, 세계로&rdquo;
          </p>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            NKBUS는 한국 패션 브랜드가 글로벌 시장에서 경쟁력을 갖출 수 있도록
            기술과 물류, 마케팅 인프라를 제공합니다.
          </p>
        </div>
      </section>
    </div>
  );
}
