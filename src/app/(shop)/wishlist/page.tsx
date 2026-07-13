import { auth } from "@/lib/auth";
import { getUserWishlist } from "@/lib/queries";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Heart } from "lucide-react";
import { WishlistGrid } from "@/components/wishlist/wishlist-grid";
import { toProductCard } from "@/lib/mappers";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/wishlist");
  const t = await getTranslations("Wishlist");

  const wishlistItems = await getUserWishlist(session.user.id);

  const products = wishlistItems.map((item) => ({
    productId: item.productId,
    ...toProductCard(item.product),
  }));

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="w-5 h-5" />
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <span className="text-sm text-gray-400">{products.length}</span>
      </div>
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Heart className="w-16 h-16 text-gray-200 mb-4" />
          <p className="text-lg font-medium text-gray-500 mb-2">{t("empty")}</p>
          <p className="text-sm text-gray-400 mb-6">{t("emptyHint")}</p>
          <Link href="/">
            <Button className="bg-black hover:bg-gray-800 text-white">{t("continueShopping")}</Button>
          </Link>
        </div>
      ) : (
        <WishlistGrid products={products} />
      )}
    </div>
  );
}
