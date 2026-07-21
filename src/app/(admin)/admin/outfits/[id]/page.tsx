import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminOutfitById } from "@/lib/queries";
import { OutfitItemManager } from "@/components/admin/outfit-item-manager";
import { OutfitCoverEditor } from "@/components/admin/outfit-cover-editor";

export default async function AdminOutfitEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const outfit = await getAdminOutfitById(id);
  if (!outfit) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/admin/outfits"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-black"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> 코디 목록
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{outfit.title}</h1>
        <p className="text-xs text-gray-400 font-mono mt-1">
          /outfits/{outfit.slug} · {outfit.isPublished ? "공개" : "비공개"}
        </p>
      </div>

      {/* 커버 사진 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">커버 사진</CardTitle>
        </CardHeader>
        <CardContent>
          <OutfitCoverEditor outfitId={outfit.id} coverImage={outfit.coverImage || null} />
        </CardContent>
      </Card>

      {/* 아이템 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">아이템</CardTitle>
        </CardHeader>
        <CardContent>
          <OutfitItemManager outfitId={outfit.id} items={outfit.products} />
        </CardContent>
      </Card>
    </div>
  );
}
