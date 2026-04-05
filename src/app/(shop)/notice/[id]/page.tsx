import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";

const NOTICES: Record<string, { category: string; title: string; date: string; content: string }> = {
  "1": {
    category: "서비스",
    title: "NKBUS 서비스 이용약관 개정 안내",
    date: "2026.04.01",
    content: `안녕하세요, NKBUS입니다.

서비스 이용약관이 아래와 같이 개정되어 안내드립니다.

■ 개정 시행일: 2026년 5월 1일

■ 주요 변경 사항
1. 구매대행 서비스 이용 조건 변경
  - 최소 주문 금액 조정 (50,000원 → 30,000원)
  - 중국 배송 무료 기준 변경 (200,000원 이상 주문 시)

2. 개인정보 처리 관련 조항 업데이트
  - 해외 배송을 위한 개인정보 제3자 제공 동의 절차 명확화
  - 중국 현지 물류 파트너사 정보 추가

3. 반품/교환 정책 변경
  - 해외 배송 상품 반품 기한 변경 (수령 후 14일 → 수령 후 7일)
  - 단순 변심 반품 시 해외 배송비 고객 부담 명시

변경된 약관은 NKBUS 앱 및 웹사이트에서 확인하실 수 있습니다.
문의사항은 고객센터(1544-7199)로 연락 부탁드립니다.

감사합니다.`,
  },
  "2": {
    category: "배송",
    title: "중국 배송 지연 관련 안내",
    date: "2026.03.25",
    content: `안녕하세요, NKBUS입니다.

현재 중국 현지 물류 사정으로 인해 일부 지역 배송이 지연되고 있어 안내드립니다.

■ 영향 지역: 광동성, 절강성, 상해 일부 지역
■ 예상 지연 기간: 2~3 영업일 추가 소요
■ 원인: 현지 물류 센터 시스템 업그레이드 작업

배송 지연으로 불편을 드려 죄송합니다.
정상화되는 대로 추가 안내드리겠습니다.

문의: 고객센터 1544-7199 / sosexy76@naver.com`,
  },
  "3": {
    category: "이벤트",
    title: "봄 시즌 프로모션 안내",
    date: "2026.03.15",
    content: `안녕하세요, NKBUS입니다.

봄 시즌을 맞아 특별 프로모션을 준비했습니다!

■ 프로모션 기간: 2026.03.15 ~ 2026.04.15

■ 혜택 내용
1. 골프웨어 전 상품 15% 할인
2. 신규 입점 브랜드 첫 구매 20% 쿠폰 지급
3. 10만원 이상 구매 시 중국 배송비 무료
4. AliPay / WeChat Pay 결제 시 추가 5% 할인

■ 유의사항
- 일부 상품은 프로모션 대상에서 제외될 수 있습니다.
- 쿠폰은 1인 1매, 발급일로부터 30일 유효합니다.
- 다른 할인과 중복 적용이 불가합니다.

많은 관심 부탁드립니다. 감사합니다.`,
  },
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const notice = NOTICES[id];
  return { title: notice?.title ?? "공지사항" };
}

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notice = NOTICES[id];

  if (!notice) notFound();

  return (
    <div className="max-w-[960px] mx-auto px-4 lg:px-6 py-8">
      <Link
        href="/notice"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        목록으로
      </Link>

      {/* 헤더 */}
      <div className="border-t-2 border-black pt-6 pb-4 border-b">
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-500">
          {notice.category}
        </span>
        <h1 className="text-xl font-bold text-gray-900 mt-3">{notice.title}</h1>
        <p className="text-xs text-gray-400 mt-2">{notice.date}</p>
      </div>

      {/* 본문 */}
      <div className="py-8 min-h-[300px]">
        <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
          {notice.content}
        </pre>
      </div>

      {/* 이전/다음 */}
      <div className="border-t">
        {NOTICES[String(Number(id) - 1)] && (
          <Link
            href={`/notice/${Number(id) - 1}`}
            className="flex items-center gap-3 px-4 py-3 border-b hover:bg-gray-50 text-sm"
          >
            <span className="text-xs text-gray-400 shrink-0">이전</span>
            <span className="text-gray-700 truncate">
              {NOTICES[String(Number(id) - 1)].title}
            </span>
          </Link>
        )}
        {NOTICES[String(Number(id) + 1)] && (
          <Link
            href={`/notice/${Number(id) + 1}`}
            className="flex items-center gap-3 px-4 py-3 border-b hover:bg-gray-50 text-sm"
          >
            <span className="text-xs text-gray-400 shrink-0">다음</span>
            <span className="text-gray-700 truncate">
              {NOTICES[String(Number(id) + 1)].title}
            </span>
          </Link>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/notice"
          className="inline-block px-6 py-2 text-sm border border-gray-300 rounded hover:border-black transition-colors"
        >
          목록으로
        </Link>
      </div>
    </div>
  );
}
