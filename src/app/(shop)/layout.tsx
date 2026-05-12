import { Header } from "@/components/layout/header";
import { GNB } from "@/components/layout/gnb";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { auth } from "@/lib/auth";
import { getCartCount, getBrandsForMenu, getCategoryMenuTree } from "@/lib/queries";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const [cartCount, menuBrands, menuCategories] = await Promise.all([
    session?.user?.id ? getCartCount(session.user.id) : Promise.resolve(0),
    getBrandsForMenu(),
    getCategoryMenuTree(),
  ]);

  return (
    <>
      <Header
        cartCount={cartCount}
        menuBrands={menuBrands}
        menuCategories={menuCategories}
      />
      <GNB />
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <Footer />
      <MobileNav />
    </>
  );
}
