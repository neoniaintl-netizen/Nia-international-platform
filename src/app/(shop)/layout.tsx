import { Header } from "@/components/layout/header";
import { GNB } from "@/components/layout/gnb";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { auth } from "@/lib/auth";
import { getCartCount } from "@/lib/queries";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const cartCount = session?.user?.id ? await getCartCount(session.user.id) : 0;

  return (
    <>
      <Header cartCount={cartCount} />
      <GNB />
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <Footer />
      <MobileNav />
    </>
  );
}
