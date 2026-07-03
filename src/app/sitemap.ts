import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const BASE_URL =
  process.env.AUTH_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://kfashionly.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths: MetadataRoute.Sitemap = [
    "/",
    "/products",
    "/category",
    "/brands",
    "/search",
    "/ranking",
    "/snap",
    "/release",
    "/magazine",
    "/about",
    "/stores",
    "/partner",
    "/support",
    "/notice",
    "/faq",
    "/event/payment",
    "/login",
    "/register",
  ].map((p) => ({
    url: `${BASE_URL}${p}`,
    lastModified: new Date(),
    changeFrequency: p === "/" ? "daily" : "weekly",
    priority: p === "/" ? 1 : 0.7,
  }));

  try {
    const [products, categories, brands, magazines] = await Promise.all([
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        select: { slug: true, updatedAt: true },
        take: 500,
      }),
      prisma.category.findMany({ select: { slug: true } }),
      prisma.brand.findMany({
        where: { isActive: true },
        select: { slug: true },
      }),
      prisma.magazine.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
        take: 200,
      }),
    ]);

    return [
      ...staticPaths,
      ...products.map((p) => ({
        url: `${BASE_URL}/products/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...categories.map((c) => ({
        url: `${BASE_URL}/category/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...brands.map((b) => ({
        url: `${BASE_URL}/brands/${b.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...magazines.map((m) => ({
        url: `${BASE_URL}/magazine/${m.slug}`,
        lastModified: m.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
    ];
  } catch {
    return staticPaths;
  }
}
