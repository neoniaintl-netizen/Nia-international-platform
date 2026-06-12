import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const FOOTER_NAV = [
  {
    title: "어바웃 NOVAREN",
    links: [
      { label: "회사 소개", href: "/about" },
      { label: "비즈니스 소개", href: "/about" },
      { label: "지속 가능성", href: "/about" },
      { label: "뉴스룸", href: "/notice" },
      { label: "채용 정보", href: "/about" },
    ],
  },
  {
    title: "오프라인 스토어",
    links: [
      { label: "NOVAREN 스토어", href: "/stores" },
      { label: "NOVAREN 스탠다드", href: "/stores" },
      { label: "NOVAREN 엠프티", href: "/stores" },
      { label: "NOVAREN 스퀘어", href: "/stores" },
      { label: "NOVAREN 테라스", href: "/stores" },
      { label: "아즈니섬", href: "/stores" },
      { label: "NOVAREN 골프", href: "/stores" },
    ],
  },
  {
    title: "비즈니스",
    links: [
      { label: "29CM", href: "/about" },
      { label: "솔드아웃", href: "/about" },
      { label: "엠프티", href: "/about" },
      { label: "NOVAREN 파트너스", href: "/partner" },
      { label: "NOVAREN 스튜디오", href: "/about" },
      { label: "NOVAREN 트레이딩", href: "/about" },
      { label: "NOVAREN 로지스틱스", href: "/about" },
    ],
  },
  {
    title: "파트너 지원",
    links: [
      { label: "중국 입점 문의", href: "/partner" },
      { label: "광고/제휴 문의", href: "/partner" },
      { label: "도소매 문의", href: "/partner" },
      { label: "공동/대량 구매 문의", href: "/partner" },
    ],
  },
];

const CUSTOMER_SUPPORT = {
  title: "고객 지원",
  quickLinks: [
    { label: "1:1 문의하기", href: "/support", bold: true },
    { label: "FAQ 자주 묻는 질문", href: "/faq", bold: true },
    { label: "안전 거래 센터", href: "/support", bold: true },
  ],
  phone: "1544-7199",
  hours: "평일 09:00 - 18:00 (점심시간 12:00 - 13:00 제외)",
  email: "sosexy76@naver.com",
};

const CHANNELS = [
  { label: "GOLF", href: "/category/golf" },
  { label: "SPORTS", href: "/category/sports" },
  { label: "OUTDOOR", href: "/category/outdoor" },
  { label: "BEAUTY", href: "/category/beauty" },
  { label: "WOMEN", href: "/category/women" },
];

const NOTICES = [
  { title: "NOVAREN 서비스 이용약관 개정 안내", date: "2026.04.01" },
  { title: "중국 배송 지연 관련 안내", date: "2026.03.25" },
  { title: "봄 시즌 프로모션 안내", date: "2026.03.15" },
];

type PaymentLogo = "novarenpay" | "alipay";

const PAYMENT_BENEFITS: Array<{ logo: PaymentLogo; text: string }> = [
  { logo: "novarenpay", text: "NOVARENPay 첫 결제 시 5천원 할인" },
  { logo: "alipay", text: "AliPay 결제 시 위안화 직결제 지원" },
];

function PaymentLogoIcon({ logo }: { logo: PaymentLogo }) {
  if (logo === "alipay") {
    return (
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-[4px] text-[11px] font-bold text-white"
        style={{ backgroundColor: "#1677FF" }}
        aria-label="Alipay"
      >
        支
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded-[4px] text-[10px] font-bold text-white"
      style={{ backgroundColor: "#0A0A0A" }}
      aria-label="NOVAREN Pay"
    >
      N
    </span>
  );
}

export function Footer() {
  return (
    <footer className="bg-[var(--paper)] border-t border-[var(--line)] mt-auto">
      {/* ── 채널 + 공지 + 결제혜택 ── */}
      <div className="bg-white border-b">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
          {/* 채널 탭 */}
          <div className="flex items-center gap-1 overflow-x-auto py-3 border-b">
            {CHANNELS.map((ch) => (
              <Link
                key={ch.label}
                href={ch.href}
                className="shrink-0 px-4 py-2 text-[11px] uppercase tracking-[0.15em] font-medium text-[var(--ink-muted)] border border-[var(--line)] rounded-none hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors"
              >
                {ch.label}
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            {/* 공지사항 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">공지사항</h3>
                <Link href="/notice" className="text-xs text-gray-400 hover:text-black">
                  전체보기
                </Link>
              </div>
              <ul className="space-y-2">
                {NOTICES.map((notice, i) => (
                  <li key={notice.title} className="flex items-center justify-between">
                    <Link href={`/notice/${i + 1}`} className="text-[13px] text-gray-600 hover:text-black truncate mr-4">
                      {notice.title}
                    </Link>
                    <span className="text-[11px] text-gray-400 shrink-0">{notice.date}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 결제 혜택 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">결제 혜택</h3>
                <Link href="/event/payment" className="text-xs text-gray-400 hover:text-black">
                  전체보기
                </Link>
              </div>
              <ul className="space-y-2">
                {PAYMENT_BENEFITS.map((benefit) => (
                  <li key={benefit.text} className="flex items-center gap-2">
                    <PaymentLogoIcon logo={benefit.logo} />
                    <span className="text-[13px] text-gray-600">{benefit.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── 하단 메뉴 ── */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6 pt-10 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* 4개 일반 컬럼 */}
          {FOOTER_NAV.map((section) => (
            <div key={section.title}>
              <h3 className="text-[11px] uppercase tracking-[0.2em] font-medium text-[var(--ink)] mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-gray-500 hover:text-black transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* 고객 지원 컬럼 */}
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] font-medium text-[var(--ink)] mb-4">
              {CUSTOMER_SUPPORT.title}
            </h3>
            <ul className="space-y-2">
              {CUSTOMER_SUPPORT.quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[13px] font-semibold text-gray-700 hover:text-black underline-offset-2 hover:underline transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1.5 text-[13px] text-gray-500">
              <p>
                고객센터{" "}
                <span className="font-semibold text-gray-700">
                  {CUSTOMER_SUPPORT.phone}
                </span>
              </p>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                운영시간 : {CUSTOMER_SUPPORT.hours}
              </p>
              <p className="text-[12px] text-gray-400">
                {CUSTOMER_SUPPORT.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── 하단 정보 ── */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-8">
        <p className="text-sm font-bold text-gray-900">
          노바렌 | &copy; NOVAREN ALL RIGHTS RESERVED
        </p>

        <div className="mt-4 space-y-1 text-xs text-gray-400">
          <p>
            상호명: (주)니아인터내셔널 | 대표자: 윤지언 | 주소: 서울특별시 강남구
            논현로102길 5(역삼동) 4층
          </p>
          <p>
            사업자등록번호: 291-81-02452 | 통신판매업신고번호: 2022-서울강남-04687
          </p>
        </div>

        <div className="mt-5 space-y-2 text-xs text-gray-400 leading-relaxed">
          <p>
            당사는 고객님이 현금 결제한 금액에 대해 우리은행과 채무지급보증
            계약을 체결하여 안전거래를 보장하고 있습니다.{" "}
            <span className="text-gray-500 underline cursor-pointer">
              서비스 가입사실 확인
            </span>
          </p>
          <p>
            일부 상품의 경우 주식회사 NOVAREN는 통신판매의 당사자가 아닌
            통신판매중개자 및 구매대행 서비스 제공자로서 상품, 상품정보, 거래에
            대한 책임이 제한될 수 있으므로, 각 상품 페이지에서 구체적인 내용을
            확인하시기 바랍니다.
          </p>
        </div>

        {/* 결제수단 */}
        <div className="mt-6">
          <p className="text-[11px] text-gray-400 mb-2.5">지원 결제수단</p>
          <div className="flex flex-wrap items-center gap-2">
            {[
              "VISA",
              "Mastercard",
              "JCB",
              "AMEX",
              "AliPay",
              "WeChat Pay",
              "NOVARENPay",
            ].map((method) => (
              <span
                key={method}
                className="inline-block px-2 py-0.5 text-[10px] font-medium border border-[var(--line)] rounded-none text-[var(--ink-muted)] uppercase tracking-[0.1em]"
              >
                {method}
              </span>
            ))}
          </div>
        </div>

        {/* 지원 언어 */}
        <div className="mt-4">
          <p className="text-[11px] text-gray-400 mb-2">지원 언어</p>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
            <span>한국어</span>
            <span>English</span>
            <span>日本語</span>
            <span>中文</span>
            <span>Tiếng Việt</span>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Policy links */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <Link
            href="/policy/privacy"
            className="font-bold text-gray-700 hover:text-black"
          >
            개인정보처리방침
          </Link>
          <Link href="/policy/terms" className="text-gray-500 hover:text-black">
            이용약관
          </Link>
          <Link href="/policy/payment" className="text-gray-500 hover:text-black">
            결제대행 위탁사
          </Link>
          <Link href="/policy/dispute" className="text-gray-500 hover:text-black">
            분쟁해결기준
          </Link>
          <Link href="/policy/cctv" className="text-gray-500 hover:text-black">
            영상정보처리기기 운영·관리방침
          </Link>
        </div>

        {/* Certifications */}
        <div className="mt-6 space-y-2 text-xs text-gray-400">
          <p>
            윤리·준법경영 국제 표준 통합 인증 · 안전보건경영시스템 국제 인증
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 border border-[var(--line)] rounded-none px-2 py-1 text-[10px] font-medium text-[var(--ink-muted)] uppercase tracking-[0.15em]">
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              ISMS
            </span>
            <span className="text-gray-400">정보보호 관리체계 ISMS 인증</span>
          </div>
        </div>

        {/* Social icons */}
        <div className="flex items-center gap-3 mt-6">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-black hover:border-gray-500 transition-colors"
            aria-label="Instagram"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="5" />
              <circle
                cx="17.5"
                cy="6.5"
                r="1"
                fill="currentColor"
                stroke="none"
              />
            </svg>
          </a>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-black hover:border-gray-500 transition-colors"
            aria-label="YouTube"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.9 31.9 0 0 0 0 12a31.9 31.9 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4L16 12l-6.5 3.6z" />
            </svg>
          </a>
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-black hover:border-gray-500 transition-colors"
            aria-label="X"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href="https://tiktok.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-black hover:border-gray-500 transition-colors"
            aria-label="TikTok"
          >
            <svg
              className="w-4.5 h-4.5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.68a8.21 8.21 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.11z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
