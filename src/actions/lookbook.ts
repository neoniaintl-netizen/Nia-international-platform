"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다.");
  }
}

export async function createLookbookAction(_prev: any, formData: FormData) {
  await requireAdmin();

  const title = (formData.get("title") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim();
  const subtitle = (formData.get("subtitle") as string)?.trim() || null;
  const season = (formData.get("season") as string)?.trim() || null;
  const gender = (formData.get("gender") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const coverImage = (formData.get("coverImage") as string)?.trim();
  const brandSlug = (formData.get("brandSlug") as string)?.trim();

  if (!title || !slug || !coverImage) {
    return { error: "제목, slug, 커버 이미지는 필수입니다." };
  }

  let brandId: string | null = null;
  if (brandSlug) {
    const brand = await prisma.brand.findUnique({
      where: { slug: brandSlug },
      select: { id: true },
    });
    if (!brand) return { error: "브랜드 slug가 올바르지 않습니다." };
    brandId = brand.id;
  }

  try {
    await prisma.lookbook.create({
      data: {
        title,
        slug,
        subtitle,
        season,
        gender,
        description,
        coverImage,
        brandId,
        isPublished: true,
      },
    });
    revalidatePath("/admin/lookbooks");
    revalidatePath("/lookbook");
    return { success: true };
  } catch (err: any) {
    if (err.code === "P2002") {
      return { error: "이미 존재하는 slug입니다." };
    }
    return { error: err.message };
  }
}

export async function toggleLookbookPublishAction(id: string) {
  await requireAdmin();
  const lb = await prisma.lookbook.findUnique({ where: { id } });
  if (!lb) return { error: "룩북을 찾을 수 없습니다." };
  await prisma.lookbook.update({
    where: { id },
    data: { isPublished: !lb.isPublished },
  });
  revalidatePath("/admin/lookbooks");
  revalidatePath("/lookbook");
  return { success: true, isPublished: !lb.isPublished };
}

export async function deleteLookbookAction(id: string) {
  await requireAdmin();
  await prisma.lookbook.delete({ where: { id } });
  revalidatePath("/admin/lookbooks");
  return { success: true };
}
