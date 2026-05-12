"use client";

import { useState } from "react";
import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQ_CATEGORIES = ["전체", "주문/결제", "배송", "반품/교환", "구매대행", "입점"] as const;

const FAQS = [
  {
    category: "주문/결제",
    question: "어떤 결제 수단을 지원하나요?",
    answer:
      "NOVAREN는 VISA, Mastercard, JCB, AMEX 등 주요 해외 카드와 AliPay, WeChat Pay, NOVARENPay, KakaoPay를 지원합니다. 중국 고객의 경우 AliPay 또는 WeChat Pay로 위안화 직결제가 가능합니다.",
  },
  {
    category: "주문/결제",
    question: "주문 취소는 어떻게 하나요?",
    answer:
      '상품 발송 전까지 [마이페이지 > 주문내역]에서 취소가 가능합니다. 이미 발송된 상품은 수령 후 반품 절차를 진행해주세요. 구매대행 상품의 경우 "배송 준비중" 단계 이전까지만 취소 가능합니다.',
  },
  {
    category: "배송",
    question: "중국 배송은 얼마나 걸리나요?",
    answer:
      "중국 배송은 결제 완료 후 평균 5~10 영업일 소요됩니다. EMS(3~5일), 항공특송(5~7일), 해상운송(10~15일) 중 선택 가능하며, 지역 및 통관 상황에 따라 달라질 수 있습니다.",
  },
  {
    category: "배송",
    question: "해외 배송비는 얼마인가요?",
    answer:
      "배송비는 상품 무게와 배송 방법에 따라 다릅니다. EMS 기준 1kg 이하 약 15,000원, 이후 0.5kg당 약 3,000원이 추가됩니다. 20만원 이상 주문 시 기본 배송비가 무료입니다.",
  },
  {
    category: "배송",
    question: "배송 추적은 어떻게 하나요?",
    answer:
      "상품 발송 후 [마이페이지 > 주문내역]에서 운송장 번호를 확인할 수 있습니다. 국내 구간은 CJ대한통운, 해외 구간은 EMS 또는 제휴 물류사 사이트에서 추적 가능합니다.",
  },
  {
    category: "반품/교환",
    question: "해외 배송 상품도 반품이 가능한가요?",
    answer:
      "네, 수령 후 7일 이내에 반품 신청이 가능합니다. 단, 상품 하자가 아닌 단순 변심의 경우 왕복 해외 배송비는 고객 부담입니다. 상품 불량 및 오배송의 경우 무료 반품 처리됩니다.",
  },
  {
    category: "반품/교환",
    question: "교환은 어떻게 진행하나요?",
    answer:
      "해외 배송 특성상 직접 교환은 불가하며, 반품 후 재주문으로 진행됩니다. 상품 불량의 경우 반품 배송비를 NOVAREN에서 부담합니다.",
  },
  {
    category: "구매대행",
    question: "구매대행 서비스란 무엇인가요?",
    answer:
      "NOVAREN 구매대행은 한국 패션 브랜드 상품을 중국 소비자에게 판매·배송하는 서비스입니다. 정품 인증, 통관 대행, 현지 배송까지 원스톱으로 처리합니다.",
  },
  {
    category: "구매대행",
    question: "구매대행 수수료는 얼마인가요?",
    answer:
      "구매대행 수수료는 상품 가격의 10~15%이며, 브랜드 및 상품 카테고리에 따라 상이합니다. 정확한 수수료는 상품 상세 페이지에서 확인하실 수 있습니다.",
  },
  {
    category: "입점",
    question: "브랜드 입점은 어떻게 신청하나요?",
    answer:
      "[파트너 지원 > 중국 입점 문의] 페이지에서 입점 신청서를 작성해주시면, 담당자가 영업일 기준 3일 내로 연락드립니다. 사업자등록증, 브랜드 소개서, 상품 카탈로그를 함께 준비해주세요.",
  },
  {
    category: "입점",
    question: "입점 후 정산은 어떻게 이루어지나요?",
    answer:
      "정산은 월 2회(1일, 16일) 진행되며, 판매 확정(구매 확정) 기준으로 정산됩니다. 수수료를 제외한 금액이 등록된 계좌로 입금됩니다.",
  },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string>("전체");
  const [openId, setOpenId] = useState<number | null>(null);

  const filtered =
    activeCategory === "전체"
      ? FAQS
      : FAQS.filter((f) => f.category === activeCategory);

  return (
    <div className="max-w-[960px] mx-auto px-4 lg:px-6 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-2">자주 묻는 질문</h1>
      <p className="text-sm text-gray-500 mb-6">
        궁금한 점을 빠르게 확인하세요. 더 자세한 문의는 고객센터(1544-7199)로 연락주세요.
      </p>

      {/* 카테고리 필터 */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto">
        {FAQ_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setOpenId(null);
            }}
            className={cn(
              "shrink-0 px-4 py-1.5 text-sm border rounded-full transition-colors",
              activeCategory === cat
                ? "text-black border-black font-semibold"
                : "text-gray-500 hover:text-black hover:border-black"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ 아코디언 */}
      <div className="border-t-2 border-black">
        {filtered.map((faq, i) => (
          <div key={i} className="border-b">
            <button
              onClick={() => setOpenId(openId === i ? null : i)}
              className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-bold text-blue-600 shrink-0">Q</span>
              <span className="flex-1 text-sm text-gray-800">{faq.question}</span>
              <span className="text-[11px] text-gray-400 shrink-0 mr-2">
                {faq.category}
              </span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-gray-400 shrink-0 transition-transform",
                  openId === i && "rotate-180"
                )}
              />
            </button>
            {openId === i && (
              <div className="px-4 pb-4 pl-10">
                <div className="flex gap-3">
                  <span className="text-sm font-bold text-gray-400 shrink-0">A</span>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {faq.answer}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 하단 안내 */}
      <div className="mt-10 p-6 bg-gray-50 rounded-xl text-center">
        <p className="text-sm font-bold text-gray-700 mb-1">
          원하는 답변을 찾지 못하셨나요?
        </p>
        <p className="text-xs text-gray-500 mb-4">
          고객센터로 문의해주시면 빠르게 도움드리겠습니다.
        </p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-sm font-bold text-gray-900">1544-7199</span>
          <span className="text-xs text-gray-400">
            평일 09:00 - 18:00 (점심 12:00 - 13:00 제외)
          </span>
        </div>
      </div>
    </div>
  );
}
