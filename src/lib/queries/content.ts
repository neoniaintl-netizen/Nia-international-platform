import { prisma } from "../db";

// ─── Banner helpers ───

export async function getActiveBanners(position = "HOME_MAIN") {
  const now = new Date();
  return prisma.banner.findMany({
    where: {
      position,
      isActive: true,
      OR: [
        { startsAt: null },
        { startsAt: { lte: now }, endsAt: { gte: now } },
        { startsAt: { lte: now }, endsAt: null },
      ],
    },
    orderBy: { sortOrder: "asc" },
  });
}

// ─── Content helpers ───

export async function getPublishedMagazines(limit = 6) {
  return prisma.magazine.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export async function getSnaps(limit = 12) {
  return prisma.snap.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUpcomingReleases(limit = 6) {
  return prisma.release.findMany({
    where: { status: "UPCOMING" },
    orderBy: { releaseDate: "asc" },
    take: limit,
  });
}

export async function getReleasedItems(limit = 4) {
  return prisma.release.findMany({
    where: { status: { in: ["RELEASED", "SOLDOUT"] } },
    orderBy: { releaseDate: "desc" },
    take: limit,
  });
}

// ─── 추천 코디 (OUTFIT = kind 확장 룩북) ───

/** 코디 목록 (공개, 아이템 1개 이상) — 총액 계산 포함 */
export async function getOutfits(limit = 30) {
  const outfits = await prisma.lookbook.findMany({
    where: { kind: "OUTFIT", isPublished: true, products: { some: {} } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      products: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: {
            select: {
              originalPrice: true,
              salePrice: true,
              status: true,
              images: { where: { isMain: true }, take: 1, select: { url: true } },
            },
          },
        },
      },
    },
  });
  return outfits.map((o) => {
    const total = o.products.reduce(
      (sum, lp) => sum + (lp.product.salePrice ?? lp.product.originalPrice),
      0
    );
    return {
      id: o.id,
      title: o.title,
      slug: o.slug,
      subtitle: o.subtitle,
      coverImage: o.coverImage || null,
      itemImages: o.products
        .map((lp) => lp.product.images[0]?.url)
        .filter((u): u is string => !!u)
        .slice(0, 4),
      itemCount: o.products.length,
      totalPrice: total,
    };
  });
}

/** 코디 상세 — 역할별 아이템 + variants(사이즈) */
export async function getOutfitBySlug(slug: string) {
  const o = await prisma.lookbook.findFirst({
    where: { slug, kind: "OUTFIT", isPublished: true, products: { some: {} } },
    include: {
      products: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: {
            include: {
              brand: { select: { name: true, nameKo: true, slug: true } },
              images: { where: { isMain: true }, take: 1 },
              variants: { where: { isActive: true } },
            },
          },
        },
      },
    },
  });
  if (!o) return null;
  return o;
}

/** 특정 상품이 포함된 공개 코디 (상품 상세 역참조 레일용) */
export async function getOutfitsContaining(productId: string, limit = 6) {
  const outfits = await prisma.lookbook.findMany({
    where: {
      kind: "OUTFIT",
      isPublished: true,
      products: { some: { productId } },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      products: {
        include: {
          product: {
            select: { images: { where: { isMain: true }, take: 1, select: { url: true } } },
          },
        },
      },
    },
  });
  return outfits.map((o) => ({
    id: o.id,
    title: o.title,
    slug: o.slug,
    coverImage: o.coverImage || null,
    itemImages: o.products
      .map((lp) => lp.product.images[0]?.url)
      .filter((u): u is string => !!u)
      .slice(0, 4),
    itemCount: o.products.length,
  }));
}

/** 관리자: 코디 목록 (비공개 포함) */
export async function getAdminOutfits() {
  return prisma.lookbook.findMany({
    where: { kind: "OUTFIT" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { products: true } } },
  });
}

/** 관리자: 코디 1개 상세 (편집용) */
export async function getAdminOutfitById(id: string) {
  return prisma.lookbook.findFirst({
    where: { id, kind: "OUTFIT" },
    include: {
      products: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              status: true,
              originalPrice: true,
              salePrice: true,
              brand: { select: { name: true } },
              images: { where: { isMain: true }, take: 1, select: { url: true } },
            },
          },
        },
      },
    },
  });
}
