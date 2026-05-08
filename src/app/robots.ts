import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.AUTH_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://nkbus-production.up.railway.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 정상 검색엔진 — 공개 페이지 허용
      {
        userAgent: ["Googlebot", "Bingbot", "Yeti", "NaverBot", "Daumoa"],
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/my/", "/checkout/", "/__hp_*", "/internal/"],
        crawlDelay: 1,
      },
      // 명시적으로 차단할 스크래퍼/AI 학습 봇
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "CCBot",
          "anthropic-ai",
          "ClaudeBot",
          "Claude-Web",
          "Google-Extended",
          "PerplexityBot",
          "Bytespider",
          "DataForSeoBot",
          "MJ12bot",
          "AhrefsBot",
          "SemrushBot",
          "DotBot",
          "Megaindex",
        ],
        disallow: "/",
      },
      // 그 외 모든 봇 — 기본 정책
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/my/", "/checkout/", "/__hp_*", "/internal/"],
        crawlDelay: 5,
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
