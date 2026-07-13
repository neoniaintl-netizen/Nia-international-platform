import { auth } from "@/lib/auth";
import { getUserCart, getUserPoints, getUserCouponCount } from "@/lib/queries";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { FUNPAY_CURRENCY, FUNPAY_KRW_PER_CNY, FUNPAY_WECHAT_ENABLED } from "@/lib/payment/funpay";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ items?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/checkout");

  const { items: itemsParam } = await searchParams;
  const t = await getTranslations("Checkout");

  const [allCartItems, userPoints, couponCount] = await Promise.all([
    getUserCart(session.user.id),
    getUserPoints(session.user.id),
    getUserCouponCount(session.user.id),
  ]);

  // 선택 결제: items 쿼리(선택한 장바구니 항목 id)가 있으면 그 항목만, 없으면 전체.
  const selectedIds = itemsParam
    ? itemsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : null;
  const cartItems = selectedIds
    ? allCartItems.filter((i) => selectedIds.includes(i.id))
    : allCartItems;

  if (cartItems.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
        <h1 className="text-xl font-bold mb-6">{t("title")}</h1>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-200 mb-4" />
          <p className="text-lg font-medium text-gray-500 mb-2">{t("emptyTitle")}</p>
          <p className="text-sm text-gray-400 mb-6">{t("emptyHint")}</p>
          <Link href="/">
            <Button className="bg-black hover:bg-gray-800 text-white">{t("goShopping")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const items = cartItems.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    product: {
      name: item.product.name,
      originalPrice: item.product.originalPrice,
      salePrice: item.product.salePrice,
      brand: { name: item.product.brand.name },
      images: item.product.images.map((img) => ({ url: img.url })),
    },
    variant: item.variant
      ? { color: item.variant.color, size: item.variant.size }
      : null,
  }));

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-xl font-bold mb-6">{t("title")}</h1>
      <CheckoutForm
        items={items}
        userPoints={userPoints}
        couponCount={couponCount}
        funpayCurrency={FUNPAY_CURRENCY}
        krwPerCny={FUNPAY_KRW_PER_CNY}
        wechatEnabled={FUNPAY_WECHAT_ENABLED}
        selectedItemIds={cartItems.map((i) => i.id)}
      />
    </div>
  );
}
