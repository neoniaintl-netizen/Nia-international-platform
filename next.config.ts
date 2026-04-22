import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },

      // 무신사 CDN
      { protocol: "https", hostname: "image.musinsa.com" },
      { protocol: "https", hostname: "**.musinsa.com" },

      // Shopify CDN (Salomon, Wilson, Alo Yoga 공용)
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "**.shopify.com" },
      { protocol: "https", hostname: "**.shopifycdn.com" },

      // 브랜드 직영 사이트들
      { protocol: "https", hostname: "salomon.co.kr" },
      { protocol: "https", hostname: "**.salomon.co.kr" },
      { protocol: "https", hostname: "www.patagonia.co.kr" },
      { protocol: "https", hostname: "**.patagonia.co.kr" },
      { protocol: "https", hostname: "arcteryx.co.kr" },
      { protocol: "https", hostname: "**.arcteryx.co.kr" },
      { protocol: "https", hostname: "www.thenorthfacekorea.co.kr" },
      { protocol: "https", hostname: "**.thenorthfacekorea.co.kr" },
      { protocol: "https", hostname: "www.kolonsport.com" },
      { protocol: "https", hostname: "**.kolonsport.com" },
      { protocol: "https", hostname: "dk-on.com" },
      { protocol: "https", hostname: "**.dk-on.com" },
      { protocol: "https", hostname: "kr.wilson.com" },
      { protocol: "https", hostname: "**.wilson.com" },
      { protocol: "https", hostname: "www.aloyoga.com" },
      { protocol: "https", hostname: "**.aloyoga.com" },

      // Nike CDN
      { protocol: "https", hostname: "**.nike.com" },
      { protocol: "https", hostname: "static.nike.com" },

      // 29CM / WConcept (혹시 크롤링 확장 시)
      { protocol: "https", hostname: "**.29cm.co.kr" },
      { protocol: "https", hostname: "**.wconcept.co.kr" },

      // 일반 CDN
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },

  // ── 번들 최적화 ──
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "bcryptjs",
    "cheerio",
  ],

  experimental: {
    optimizePackageImports: ["lucide-react", "@base-ui/react"],
  },
};

export default nextConfig;
