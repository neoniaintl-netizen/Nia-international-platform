"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Truck, Tag, Loader2, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { createOrder } from "@/actions/order";
import { applyCouponCode } from "@/actions/coupon";
import { DaumPostcodeButton } from "@/components/shared/daum-postcode";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    name: string;
    originalPrice: number;
    salePrice: number | null;
    brand: { name: string };
    images: { url: string }[];
  };
  variant: {
    color: string | null;
    size: string | null;
  } | null;
}

const PAYMENT_METHODS = [
  { value: "ALIPAY", label: "Alipay 알리페이" },
  { value: "WECHAT_PAY", label: "WeChat Pay 위챗페이" },
];

export function CheckoutForm({
  items,
  userPoints,
  couponCount,
  funpayCurrency = "KRW",
  krwPerCny = 190,
}: {
  items: CartItem[];
  userPoints: number;
  couponCount: number;
  funpayCurrency?: string;
  krwPerCny?: number;
}) {
  const [state, formAction, isPending] = useActionState(createOrder, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [paymentMethod, setPaymentMethod] = useState("ALIPAY");
  const [zipCode, setZipCode] = useState("");
  const [address1, setAddress1] = useState("");
  const address2Ref = useRef<HTMLInputElement>(null);
  const [redirecting, setRedirecting] = useState(false);

  // createOrder 가 Funpay 결제 파라미터를 반환하면 → 숨김 form 만들어 Funpay 결제창으로 POST 이동
  useEffect(() => {
    const funpay = (state as any)?.funpay;
    if (!funpay) return;
    setRedirecting(true);
    const f = document.createElement("form");
    f.method = "POST";
    f.action = funpay.action;
    f.acceptCharset = "UTF-8";
    for (const [k, v] of Object.entries(funpay.params as Record<string, string>)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = k;
      input.value = v ?? "";
      f.appendChild(input);
    }
    document.body.appendChild(f);
    f.submit();
  }, [state]);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);

  // Points state
  const [usedPoints, setUsedPoints] = useState(0);

  const handleAddressComplete = useCallback(
    (data: { zipCode: string; address: string }) => {
      setZipCode(data.zipCode);
      setAddress1(data.address);
      setTimeout(() => address2Ref.current?.focus(), 100);
    },
    []
  );

  const subtotal = items.reduce((sum, item) => {
    const price = item.product.salePrice ?? item.product.originalPrice;
    return sum + price * item.quantity;
  }, 0);
  const shipping = subtotal >= 30000 ? 0 : 3000;
  const discount = couponDiscount + usedPoints;
  const total = subtotal - discount + shipping;
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

  // 알리/위챗은 위안화(CNY)로 결제 → 고객에게 환산 청구액 표시
  const isCny = funpayCurrency === "CNY" && krwPerCny > 0;
  const cnyAmount = isCny ? total / krwPerCny : 0;
  const fmtCny = (n: number) =>
    "¥" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponApplying(true);
    setCouponError("");
    try {
      const result = await applyCouponCode(couponCode.trim(), subtotal);
      if (result.error) {
        setCouponError(result.error);
        setCouponDiscount(0);
        setAppliedCoupon(null);
      } else if (result.success) {
        setCouponDiscount(result.discount!);
        setAppliedCoupon(result.couponCode!);
      }
    } catch {
      setCouponError("쿠폰 적용 중 오류가 발생했습니다.");
    }
    setCouponApplying(false);
  };

  const handleCancelCoupon = () => {
    setCouponCode("");
    setCouponDiscount(0);
    setAppliedCoupon(null);
    setCouponError("");
  };

  const handleUseAllPoints = () => {
    const maxUsable = Math.min(userPoints, subtotal - couponDiscount);
    setUsedPoints(Math.max(0, maxUsable));
  };

  return (
    <form ref={formRef} action={formAction}>
      <input type="hidden" name="paymentMethod" value={paymentMethod} />
      <input type="hidden" name="couponCode" value={appliedCoupon || ""} />
      <input type="hidden" name="usedPoints" value={usedPoints.toString()} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Delivery info */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5" />
              <h2 className="font-bold">배송 정보</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipient" className="text-sm mb-1.5">수령인</Label>
                  <Input id="recipient" name="recipient" placeholder="이름을 입력하세요" required />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm mb-1.5">연락처</Label>
                  <Input id="phone" name="phone" placeholder="010-0000-0000" required />
                </div>
              </div>
              <div>
                <Label htmlFor="zipCode" className="text-sm mb-1.5">우편번호</Label>
                <div className="flex gap-2 max-w-xs">
                  <Input
                    id="zipCode"
                    name="zipCode"
                    placeholder="우편번호"
                    value={zipCode}
                    readOnly
                    required
                    className="bg-gray-50"
                  />
                  <DaumPostcodeButton onComplete={handleAddressComplete} />
                </div>
              </div>
              <div>
                <Label htmlFor="address1" className="text-sm mb-1.5">주소</Label>
                <Input
                  id="address1"
                  name="address1"
                  placeholder="주소 검색 버튼을 눌러주세요"
                  value={address1}
                  readOnly
                  required
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="address2" className="text-sm mb-1.5">상세주소</Label>
                <Input id="address2" name="address2" ref={address2Ref} placeholder="상세주소를 입력하세요 (동/호수)" />
              </div>
              <div>
                <Label htmlFor="memo" className="text-sm mb-1.5">배송 메모</Label>
                <Input id="memo" name="memo" placeholder="부재 시 문 앞에 놓아주세요" />
              </div>
            </div>
          </section>

          <Separator />

          {/* Coupon & Points */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5" />
              <h2 className="font-bold">쿠폰/적립금</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm mb-1.5">쿠폰</Label>
                {appliedCoupon ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Tag className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 flex-1">
                      {appliedCoupon} (-{couponDiscount.toLocaleString()}원)
                    </span>
                    <Button type="button" variant="ghost" size="sm" onClick={handleCancelCoupon} className="text-gray-400 h-auto p-1">
                      ✕
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Input
                        placeholder="쿠폰 코드 입력"
                        className="flex-1"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <Button type="button" variant="outline" onClick={handleApplyCoupon} disabled={couponApplying}>
                        {couponApplying ? "확인중..." : "적용"}
                      </Button>
                    </div>
                    {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                  </>
                )}
                <p className="text-xs text-gray-400 mt-1.5">사용 가능한 쿠폰: {couponCount}장</p>
              </div>
              <div>
                <Label className="text-sm mb-1.5">적립금</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="0"
                    className="flex-1"
                    type="number"
                    min={0}
                    max={Math.min(userPoints, subtotal - couponDiscount)}
                    value={usedPoints || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const maxUsable = Math.min(userPoints, subtotal - couponDiscount);
                      setUsedPoints(Math.min(val, maxUsable));
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleUseAllPoints}>전액 사용</Button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">보유 적립금: {userPoints.toLocaleString()}원</p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Payment method */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5" />
              <h2 className="font-bold">결제 수단</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  className={`border rounded-xl p-4 text-sm font-medium text-center transition-colors ${
                    paymentMethod === method.value
                      ? "border-black bg-gray-50"
                      : "hover:border-gray-400"
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-36 border rounded-xl p-5 space-y-4">
            <h3 className="font-bold">주문 상품 ({totalQty})</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item) => {
                const imageUrl = item.product.images[0]?.url ?? `https://placehold.co/56x56/b8b8b8/444?text=IMG`;
                const price = item.product.salePrice ?? item.product.originalPrice;
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-14 h-14 bg-gray-100 rounded shrink-0 overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={item.product.name}
                        width={56}
                        height={56}
                        className="rounded object-cover w-full h-full"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold">{item.product.brand.name}</p>
                      <p className="text-xs truncate">{item.product.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {[item.variant?.color, item.variant?.size].filter(Boolean).join(" · ") || "ONE SIZE"} · {item.quantity}개
                      </p>
                      <p className="text-xs font-bold mt-0.5">{(price * item.quantity).toLocaleString()}원</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">상품 금액</span>
                <span>{subtotal.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">배송비</span>
                <span>{shipping === 0 ? "무료" : `${shipping.toLocaleString()}원`}</span>
              </div>
              {shipping === 0 && (
                <p className="text-xs text-green-600">3만원 이상 무료배송 적용</p>
              )}
              {discount > 0 && (
                <>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">쿠폰 할인</span>
                      <span className="text-red-500">-{couponDiscount.toLocaleString()}원</span>
                    </div>
                  )}
                  {usedPoints > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">적립금 사용</span>
                      <span className="text-red-500">-{usedPoints.toLocaleString()}원</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-bold">총 결제 금액</span>
              <span className="text-xl font-bold">{total.toLocaleString()}원</span>
            </div>
            {isCny && (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">위안화 결제 금액</span>
                  <span className="font-semibold text-gray-700">≈ {fmtCny(cnyAmount)}</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Alipay/WeChat Pay 는 위안화(CNY)로 결제됩니다. 실제 청구액 약 {fmtCny(cnyAmount)}{" "}
                  (적용환율 1 CNY ≈ {krwPerCny.toLocaleString()}원).
                </p>
              </>
            )}

            {state?.error && (
              <p className="text-sm text-red-500">{state.error}</p>
            )}

            <div className="space-y-2 mt-2">
              <p className="text-[10px] text-gray-400">
                위 주문 내용을 확인하였으며, 결제에 동의합니다.
              </p>
              <Button
                type="submit"
                disabled={isPending || redirecting || !zipCode || !address1}
                className="w-full h-14 bg-black hover:bg-gray-800 text-white font-bold text-base"
              >
                {isPending || redirecting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {redirecting ? "결제창으로 이동 중..." : "주문 처리 중..."}
                  </>
                ) : (
                  `${total.toLocaleString()}원 결제하기`
                )}
              </Button>
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>안전 결제 · Alipay/WeChat Pay (ICB Funpay)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
