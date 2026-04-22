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

export async function createEventAction(_prev: any, formData: FormData) {
  await requireAdmin();

  const title = (formData.get("title") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim();
  const subtitle = (formData.get("subtitle") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const coverImage = (formData.get("coverImage") as string)?.trim();
  const bannerImage = (formData.get("bannerImage") as string)?.trim() || null;
  const startsAtRaw = formData.get("startsAt") as string;
  const endsAtRaw = formData.get("endsAt") as string;

  if (!title || !slug || !coverImage) {
    return { error: "제목, slug, 커버 이미지는 필수입니다." };
  }

  try {
    await prisma.event.create({
      data: {
        title,
        slug,
        subtitle,
        description,
        coverImage,
        bannerImage,
        startsAt: startsAtRaw ? new Date(startsAtRaw) : null,
        endsAt: endsAtRaw ? new Date(endsAtRaw) : null,
        isPublished: true,
      },
    });
    revalidatePath("/admin/events");
    revalidatePath("/events");
    return { success: true };
  } catch (err: any) {
    if (err.code === "P2002") {
      return { error: "이미 존재하는 slug입니다." };
    }
    return { error: err.message };
  }
}

export async function toggleEventPublishAction(eventId: string) {
  await requireAdmin();
  const evt = await prisma.event.findUnique({ where: { id: eventId } });
  if (!evt) return { error: "기획전을 찾을 수 없습니다." };
  await prisma.event.update({
    where: { id: eventId },
    data: { isPublished: !evt.isPublished },
  });
  revalidatePath("/admin/events");
  revalidatePath("/events");
  return { success: true, isPublished: !evt.isPublished };
}

export async function deleteEventAction(eventId: string) {
  await requireAdmin();
  await prisma.event.delete({ where: { id: eventId } });
  revalidatePath("/admin/events");
  return { success: true };
}

export async function addProductToEventAction(
  eventId: string,
  productSlug: string
) {
  await requireAdmin();
  const product = await prisma.product.findUnique({
    where: { slug: productSlug },
  });
  if (!product) return { error: "상품을 찾을 수 없습니다." };
  try {
    await prisma.eventProduct.create({
      data: { eventId, productId: product.id },
    });
    revalidatePath("/admin/events");
    return { success: true };
  } catch (err: any) {
    if (err.code === "P2002") {
      return { error: "이미 등록된 상품입니다." };
    }
    return { error: err.message };
  }
}
