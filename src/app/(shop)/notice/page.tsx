import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "공지사항" };

const NOTICES = [
  { id: 1, category: "서비스", title: "NOVAREN 서비스 이용약관 개정 안내", date: "2026.04.01", important: true },
  { id: 2, category: "배송", title: "중국 배송 지연 관련 안내", date: "2026.03.25", important: true },
  { id: 3, category: "이벤트", title: "봄 시즌 프로모션 안내", date: "2026.03.15", important: false },
  { id: 4, category: "서비스", title: "개인정보처리방침 변경 안내", date: "2026.03.10", important: false },
  { id: 5, category: "결제", title: "AliPay 결제 시스템 점검 안내 (3/8 02:00~06:00)", date: "2026.03.05", important: false },
  { id: 6, category: "서비스", title: "NOVAREN 앱 업데이트 안내 (v2.5.0)", date: "2026.02.28", important: false },
  { id: 7, category: "배송", title: "춘절 기간 중국 배송 스케줄 변경 안내", date: "2026.02.15", important: false },
  { id: 8, category: "입점", title: "2026년 상반기 브랜드 입점 모집 안내", date: "2026.02.01", important: false },
  { id: 9, category: "결제", title: "WeChat Pay 결제 서비스 오픈 안내", date: "2026.01.20", important: false },
  { id: 10, category: "서비스", title: "NOVAREN 플랫폼 정기 점검 안내 (1/15)", date: "2026.01.12", important: false },
];

export default function NoticePage() {
  return (
    <div className="max-w-[960px] mx-auto px-4 lg:px-6 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-6">공지사항</h1>

      {/* 카테고리 필터 */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto">
        {["전체", "서비스", "배송", "결제", "입점", "이벤트"].map((cat) => (
          <button
            key={cat}
            className="shrink-0 px-4 py-1.5 text-sm border rounded-full text-gray-500 hover:text-black hover:border-black transition-colors first:text-black first:border-black first:font-semibold"
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 공지 목록 */}
      <div className="border-t-2 border-black">
        {NOTICES.map((notice) => (
          <Link
            key={notice.id}
            href={`/notice/${notice.id}`}
            className="flex items-center gap-4 px-4 py-4 border-b hover:bg-gray-50 transition-colors group"
          >
            <span
              className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded ${
                notice.important
                  ? "bg-red-50 text-red-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {notice.category}
            </span>
            <span className="flex-1 text-sm text-gray-800 group-hover:text-black truncate">
              {notice.important && (
                <span className="text-red-500 font-bold mr-1">[중요]</span>
              )}
              {notice.title}
            </span>
            <span className="shrink-0 text-xs text-gray-400">{notice.date}</span>
          </Link>
        ))}
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-center gap-1 mt-8">
        {[1, 2, 3].map((p) => (
          <button
            key={p}
            className={`w-8 h-8 text-sm rounded ${
              p === 1
                ? "bg-black text-white font-bold"
                : "text-gray-400 hover:text-black"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
