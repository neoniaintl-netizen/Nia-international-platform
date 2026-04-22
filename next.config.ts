import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next 최적화 비활성화 — 원본 URL 직접 전달
    // 이유:
    //   - placehold.co는 SVG 반환 (Next는 기본 SVG 차단 → 400)
    //   - 일부 외부 CDN URL에 특수문자 포함 (NorthFace `+%281%29`) → 400
    //   - 외부 이미지 전부를 Railway 서버에서 AVIF 변환하면 cold start 지연
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },

      // 무신사 CDN
      { protocol: "https", hostname: "image.musinsa.com" },
      { protocol: "https", hostname: "**.musinsa.com" },

      // Shopify CDN
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

      // 29CM / WConcept
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
