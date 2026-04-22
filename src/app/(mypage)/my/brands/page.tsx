import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Heart, ChevronRight } from "lucide-react";

export default async function MyBrandsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/my/brands");

  const follows = await prisma.brandFollow.findMany({
    where: { userId: session.user.id },
    include: {
      brand: {
        select: {
          id: true,
          name: true,
          nameKo: true,
          slug: true,
          logoUrl: true,
          description: true,
          followerCount: true,
          _count: { select: { products: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-black">팔로우 브랜드</h1>
        <p className="text-xs text-gray-500 mt-1">
          하트를 눌러 좋아하는 브랜드를 모아보세요
        </p>
      </div>

      {follows.length === 0 ? (
        <div className="text-center py-20 border rounded-xl">
          <Heart className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-1">
            아직 팔로우한 브랜드가 없어요
          </p>
          <p className="text-xs text-gray-400 mb-5">
            브랜드 페이지에서 하트를 눌러 팔로우해보세요
          </p>
          <Link
            href="/brands"
            className="inline-flex items-center gap-1 bg-black text-white px-5 h-10 rounded-full text-xs font-bold"
          >
            브랜드 둘러보기
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {follows.map((f) => (
            <Link
              key={f.id}
              href={`/brands/${f.brand.slug}`}
              className="border rounded-xl p-5 flex gap-4 items-center hover:border-black transition-colors"
            >
              <div className="relative w-16 h-16 rounded-full bg-gray-100 overflow-hidden shrink-0">
                {f.brand.logoUrl ? (
                  <Image
                    src={f.brand.logoUrl}
                    alt={f.brand.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-gray-400 text-lg">
                    {f.brand.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{f.brand.name}</p>
                {f.brand.nameKo && (
                  <p className="text-xs text-gray-500 truncate">
                    {f.brand.nameKo}
                  </p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">
                  팔로워 {f.brand.followerCount.toLocaleString()} · 상품{" "}
                  {f.brand._count.products.toLocaleString()}
                </p>
              </div>
              <Heart className="w-5 h-5 fill-red-500 text-red-500 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
