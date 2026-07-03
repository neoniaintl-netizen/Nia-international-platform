import Link from "next/link";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";

// 설명형 라벨은 labelKey(번역), 고유명사(스토어/브랜드명)는 label(원문 유지)
const FOOTER_NAV = [
  {
    titleKey: "aboutTitle",
    links: [
      { labelKey: "aboutCompany", href: "/about" },
      { labelKey: "aboutBusiness", href: "/about" },
      { labelKey: "aboutSustainability", href: "/about" },
      { labelKey: "aboutNewsroom", href: "/notice" },
      { labelKey: "aboutCareers", href: "/about" },
    ],
  },
  {
    titleKey: "storesTitle",
    links: [
      // 실제 매장만 노출 (/stores 페이지와 일치 — 가상 매장 목록은 2026-07 제거)
      { label: "NOVAREN 스토어", href: "/stores" },
    ],
  },
  {
    titleKey: "businessTitle",
    links: [
      { label: "NOVAREN 파트너스", href: "/partner" },
      { label: "NOVAREN 트레이딩", href: "/about" },
      { label: "NOVAREN 로지스틱스", href: "/about" },
    ],
  },
  {
    titleKey: "partnerTitle",
    links: [
      { labelKey: "partnerChina", href: "/partner" },
      { labelKey: "partnerAd", href: "/partner" },
      { labelKey: "partnerWholesale", href: "/partner" },
      { labelKey: "partnerBulk", href: "/partner" },
    ],
  },
] as const;

const SUPPORT_LINKS = [
  { labelKey: "supportInquiry", href: "/support" },
  { labelKey: "supportFaq", href: "/faq" },
  { labelKey: "supportSafe", href: "/support" },
] as const;

const CHANNELS = [
  { slug: "golf", href: "/category/golf" },
  { slug: "sports", href: "/category/sports" },
  { slug: "outdoor", href: "/category/outdoor" },
  { slug: "beauty", href: "/category/beauty" },
  { slug: "women", href: "/category/women" },
] as const;

const NOTICES = [
  { key: "notice1", date: "2026.04.01" },
  { key: "notice2", date: "2026.03.25" },
  { key: "notice3", date: "2026.03.15" },
] as const;

const PAYMENT_BENEFITS = [
  { logo: "novaren" as const, key: "benefitSignup" },
  { logo: "alipay" as const, key: "benefitAlipay" },
];

const PAYMENT_METHODS = ["VISA", "Mastercard", "JCB", "AMEX", "AliPay", "WeChat Pay"];

function PaymentLogoIcon({ logo }: { logo: "novaren" | "alipay" }) {
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
      aria-label="NOVAREN"
    >
      N
    </span>
  );
}

export function Footer() {
  const t = useTranslations("Footer");
  const tc = useTranslations("Channel");

  return (
    <footer className="bg-[var(--paper)] border-t border-[var(--line)] mt-auto">
      {/* ── 채널 + 공지 + 결제혜택 ── */}
      <div className="bg-white border-b">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
          {/* 채널 탭 */}
          <div className="flex items-center gap-1 overflow-x-auto py-3 border-b">
            {CHANNELS.map((ch) => (
              <Link
                key={ch.slug}
                href={ch.href}
                className="shrink-0 px-4 py-2 text-[11px] uppercase tracking-[0.15em] font-medium text-[var(--ink-muted)] border border-[var(--line)] rounded-none hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors"
              >
                {tc(ch.slug)}
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            {/* 공지사항 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">{t("noticeTitle")}</h3>
                <Link href="/notice" className="text-xs text-gray-400 hover:text-black">
                  {t("viewAll")}
                </Link>
              </div>
              <ul className="space-y-2">
                {NOTICES.map((notice, i) => (
                  <li key={notice.key} className="flex items-center justify-between">
                    <Link href={`/notice/${i + 1}`} className="text-[13px] text-gray-600 hover:text-black truncate mr-4">
                      {t(notice.key)}
                    </Link>
                    <span className="text-[11px] text-gray-400 shrink-0">{notice.date}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 결제 혜택 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">{t("benefitTitle")}</h3>
                <Link href="/event/payment" className="text-xs text-gray-400 hover:text-black">
                  {t("viewAll")}
                </Link>
              </div>
              <ul className="space-y-2">
                {PAYMENT_BENEFITS.map((benefit) => (
                  <li key={benefit.key} className="flex items-center gap-2">
                    <PaymentLogoIcon logo={benefit.logo} />
                    <span className="text-[13px] text-gray-600">{t(benefit.key)}</span>
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
            <div key={section.titleKey}>
              <h3 className="text-[11px] uppercase tracking-[0.2em] font-medium text-[var(--ink)] mb-4">
                {t(section.titleKey)}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={"labelKey" in link ? link.labelKey : link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-gray-500 hover:text-black transition-colors"
                    >
                      {"labelKey" in link ? t(link.labelKey) : link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* 고객 지원 컬럼 */}
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] font-medium text-[var(--ink)] mb-4">
              {t("supportTitle")}
            </h3>
            <ul className="space-y-2">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.labelKey}>
                  <Link
                    href={link.href}
                    className="text-[13px] font-semibold text-gray-700 hover:text-black underline-offset-2 hover:underline transition-colors"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1.5 text-[13px] text-gray-500">
              <p>
                {t("supportCenter")}{" "}
                <span className="font-semibold text-gray-700">1544-7199</span>
              </p>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                {t("supportHours")} : {t("hoursValue")}
              </p>
              <p className="text-[12px] text-gray-400">sosexy76@naver.com</p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── 하단 정보 ── */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-8">
        <p className="text-sm font-bold text-gray-900">
          {t("brandName")} | &copy; NOVAREN ALL RIGHTS RESERVED
        </p>

        <div className="mt-4 space-y-1 text-xs text-gray-400">
          <p>
            {t("companyLabel")}: (주)니아인터내셔널 | {t("ceoLabel")}: 윤지언 | {t("addressLabel")}: 서울특별시 강남구
            논현로102길 5(역삼동) 4층
          </p>
          <p>
            {t("bizNumberLabel")}: 291-81-02452 | {t("mailOrderLabel")}: 2022-서울강남-04687
          </p>
        </div>

        <div className="mt-5 space-y-2 text-xs text-gray-400 leading-relaxed">
          <p>
            {t("escrowNote")}{" "}
            <span className="text-gray-500 underline cursor-pointer">
              {t("escrowConfirm")}
            </span>
          </p>
          <p>{t("agencyNote")}</p>
        </div>

        {/* 결제수단 */}
        <div className="mt-6">
          <p className="text-[11px] text-gray-400 mb-2.5">{t("paymentMethods")}</p>
          <div className="flex flex-wrap items-center gap-2">
            {PAYMENT_METHODS.map((method) => (
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
          <p className="text-[11px] text-gray-400 mb-2">{t("languages")}</p>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
            <span>한국어</span>
            <span>English</span>
            <span>中文</span>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Policy links */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <Link href="/policy/privacy" className="font-bold text-gray-700 hover:text-black">
            {t("privacy")}
          </Link>
          <Link href="/policy/terms" className="text-gray-500 hover:text-black">
            {t("terms")}
          </Link>
          <Link href="/policy/payment" className="text-gray-500 hover:text-black">
            {t("paymentAgency")}
          </Link>
          <Link href="/policy/dispute" className="text-gray-500 hover:text-black">
            {t("dispute")}
          </Link>
          <Link href="/policy/cctv" className="text-gray-500 hover:text-black">
            {t("cctv")}
          </Link>
        </div>

        {/* Certifications */}
        <div className="mt-6 space-y-2 text-xs text-gray-400">
          <p>{t("certText")}</p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 border border-[var(--line)] rounded-none px-2 py-1 text-[10px] font-medium text-[var(--ink-muted)] uppercase tracking-[0.15em]">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              ISMS
            </span>
            <span className="text-gray-400">{t("ismsText")}</span>
          </div>
        </div>

        {/* Social icons */}
        <div className="flex items-center gap-3 mt-6">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-black hover:border-gray-500 transition-colors" aria-label="Instagram">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-black hover:border-gray-500 transition-colors" aria-label="YouTube">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.9 31.9 0 0 0 0 12a31.9 31.9 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4L16 12l-6.5 3.6z" />
            </svg>
          </a>
          <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-black hover:border-gray-500 transition-colors" aria-label="X">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-black hover:border-gray-500 transition-colors" aria-label="TikTok">
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.68a8.21 8.21 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.11z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
