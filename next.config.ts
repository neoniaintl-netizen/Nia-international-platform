import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next 최적화 비활성화 — 원본 URL 직접 전달
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },

      // 무신사 / 29CM / WConcept
      { protocol: "https", hostname: "**.musinsa.com" },
      { protocol: "https", hostname: "**.29cm.co.kr" },
      { protocol: "https", hostname: "**.wconcept.co.kr" },

      // Shopify CDN (범용)
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "**.shopify.com" },
      { protocol: "https", hostname: "**.shopifycdn.com" },

      // 아웃도어/스포츠 9개 브랜드
      { protocol: "https", hostname: "**.salomon.co.kr" },
      { protocol: "https", hostname: "**.patagonia.co.kr" },
      { protocol: "https", hostname: "**.arcteryx.co.kr" },
      { protocol: "https", hostname: "**.thenorthfacekorea.co.kr" },
      { protocol: "https", hostname: "**.kolonsport.com" },
      { protocol: "https", hostname: "**.wilson.com" },
      { protocol: "https", hostname: "**.aloyoga.com" },
      { protocol: "https", hostname: "**.dk-on.com" },
      { protocol: "https", hostname: "**.nike.com" },

      // 골프 브랜드 10개 (Phase 1)
      { protocol: "https", hostname: "**.markandlona-korea.co.kr" },
      { protocol: "https", hostname: "**.southcape.shop" },
      { protocol: "https", hostname: "**.anewgolf.com" },
      { protocol: "https", hostname: "**.iceberggolf.com" },
      { protocol: "https", hostname: "**.utaagolf.com" },
      { protocol: "https", hostname: "**.peltgolf.com" },
      { protocol: "https", hostname: "**.gfore.kr" },
      { protocol: "https", hostname: "**.kolonmall.com" },
      { protocol: "https", hostname: "**.kolonfnc.com" },
      { protocol: "https", hostname: "**.thecart.co.kr" },
      { protocol: "https", hostname: "**.pxg.co.kr" },

      // Cafe24 공용 CDN
      { protocol: "https", hostname: "**.cafe24img.com" },
      { protocol: "https", hostname: "**.cafe24.com" },
      { protocol: "https", hostname: "**.echosting.cafe24.com" },
      { protocol: "https", hostname: "**.poxo.com" },

      // 기타 일반 CDN
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },

  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "bcryptjs",
    "cheerio",
  ],

  experimental: {
    optimizePackageImports: ["lucide-react", "@base-ui/react"],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
