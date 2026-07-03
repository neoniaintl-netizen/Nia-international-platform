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
