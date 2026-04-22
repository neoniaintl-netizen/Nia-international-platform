"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createRepairRequestAction } from "@/actions/repair";
import { CheckCircle2, ChevronLeft } from "lucide-react";

export default function NewRepairPage() {
  const [state, formAction, isPending] = useActionState(
    createRepairRequestAction,
    null
  );

  if ((state as any)?.success) {
    return (
      <div className="max-w-md mx-auto py-10 text-center">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-600" />
        <h1 className="text-xl font-bold mb-2">수선 신청 완료</h1>
        <p className="text-sm text-gray-600 mb-1">
          접수번호 <span className="font-mono">{(state as any).requestNumber}</span>
        </p>
        <p className="text-xs text-gray-500 mb-6">
          {(state as any).message}
        </p>
        <div className="flex gap-2">
          <Link
            href="/my/repair"
            className="flex-1 h-11 bg-black text-white rounded-lg flex items-center justify-center text-sm font-bold"
          >
            접수 내역 보기
          </Link>
          <Link
            href="/my"
            className="flex-1 h-11 bg-white border border-gray-300 rounded-lg flex items-center justify-center text-sm font-bold"
          >
            마이페이지
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/my/repair"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-black mb-4"
      >
        <ChevronLeft className="w-3 h-3" />
        수선 진행조회로
      </Link>

      <h1 className="text-xl lg:text-2xl font-black mb-2">수선 신청</h1>
      <p className="text-xs text-gray-500 mb-8">
        수선이 필요한 상품 정보를 입력해주세요. 담당자가 검토 후 연락드립니다.
      </p>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">
            상품명 <span className="text-red-500">*</span>
          </label>
          <Input
            name="productName"
            placeholder="예) 아디다스 삼바 OG 화이트 블랙"
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">
            브랜드
          </label>
          <Input name="brandName" placeholder="예) 아디다스" />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">
            주문번호
          </label>
          <Input name="orderNumber" placeholder="해당 상품을 구매한 주문번호 (선택)" />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">
            수선 요청 내용 <span className="text-red-500">*</span>
          </label>
          <Textarea
            name="issue"
            rows={5}
            placeholder="예) 왼쪽 신발 뒷굽이 벌어졌습니다. 접착 수선이 가능한지 문의드립니다."
            minLength={10}
            required
          />
          <p className="text-[10px] text-gray-400 mt-1">
            10자 이상 상세히 작성해주시면 빠른 처리가 가능합니다
          </p>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">
            수거 주소
          </label>
          <Input
            name="pickupAddress"
            placeholder="수거를 원하시는 주소 (선택)"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">
            사진 URL (선택)
          </label>
          <Input
            name="imageUrls"
            placeholder="여러 장일 경우 쉼표(,)로 구분"
          />
          <p className="text-[10px] text-gray-400 mt-1">
            문제 부위 사진을 첨부하시면 정확한 견적을 안내받으실 수 있습니다
          </p>
        </div>

        {state?.error && (
          <p className="text-sm text-[var(--sale)] text-center">{state.error}</p>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-12 bg-black hover:bg-gray-800 text-white font-bold text-sm rounded-lg"
        >
          {isPending ? "접수 중..." : "수선 신청하기"}
        </Button>
      </form>

      <div className="mt-8 bg-gray-50 rounded-xl p-4 text-[11px] text-gray-500 leading-relaxed">
        <p className="font-bold text-gray-700 mb-1">수선 진행 안내</p>
        <p>• 접수 후 2영업일 이내 담당자 연락</p>
        <p>• 상품 확인 후 견적 발송 → 승인 시 수선 진행</p>
        <p>• 수선 기간: 통상 7~14일</p>
        <p>• 문의: 고객센터 1544-7199</p>
      </div>
    </div>
  );
}
