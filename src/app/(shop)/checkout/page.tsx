import { auth } from "@/lib/auth";
import { getUserCart, getUserPoints, getUserCouponCount } from "@/lib/queries";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/checkout");

  const [cartItems, userPoints, couponCount] = await Promise.all([
    getUserCart(session.user.id),
    getUserPoints(session.user.id),
    getUserCouponCount(session.user.id),
  ]);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
        <h1 className="text-xl font-bold mb-6">주문/결제</h1>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-200 mb-4" />
          <p className="text-lg font-medium text-gray-500 mb-2">주문할 상품이 없습니다</p>
          <p className="text-sm text-gray-400 mb-6">장바구니에 상품을 담아주세요.</p>
          <Link href="/">
            <Button className="bg-black hover:bg-gray-800 text-white">쇼핑하러 가기</Button>
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
      <h1 className="text-xl font-bold mb-6">주문/결제</h1>
      <CheckoutForm items={items} userPoints={userPoints} couponCount={couponCount} />
    </div>
  );
}
