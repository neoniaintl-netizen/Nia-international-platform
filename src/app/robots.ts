import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.AUTH_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://kfashionly.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/my/", "/checkout/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
