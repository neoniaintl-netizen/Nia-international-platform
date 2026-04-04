import { auth } from "@/lib/auth";
import { getUserCart } from "@/lib/queries";
import { CartClient } from "@/components/cart/cart-client";
import { redirect } from "next/navigation";

export default async function CartPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/cart");

  const cartItems = await getUserCart(session.user.id);

  // Serialize for client component
  const items = cartItems.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    product: {
      name: item.product.name,
      originalPrice: item.product.originalPrice,
      salePrice: item.product.salePrice,
      slug: item.product.slug,
      brand: { name: item.product.brand.name },
      images: item.product.images.map((img) => ({ url: img.url })),
    },
    variant: item.variant
      ? {
          color: item.variant.color,
          size: item.variant.size,
          sku: item.variant.sku,
        }
      : null,
  }));

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-xl font-bold mb-6">장바구니</h1>
      <CartClient items={items} />
    </div>
  );
}
