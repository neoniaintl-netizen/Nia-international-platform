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
    // Content-Security-Policy
    // - default-src 'self': 기본은 동일 출처만
    // - script-src: Next.js 인라인 스크립트 + PortOne SDK + 카카오/네이버페이 스크립트
    // - frame-src: PortOne 결제창 iframe + 소셜 로그인
    // - connect-src: API 호출 대상 (PortOne API + Naver/Kakao OAuth + 동일 출처)
    // - img-src: 모든 https (브랜드별 CDN 다양성 때문)
    // 'unsafe-inline'/'unsafe-eval'은 Next 16 production에서도 일부 인라인 스크립트가 필요해 허용
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.portone.io https://*.portone.io https://*.kakaocdn.net https://*.kakaopay.com https://*.naverpay.com https://*.tosspay.com https://*.tosspayments.com https://*.toss.im",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.portone.io https://*.portone.io https://*.kakao.com https://*.kakaopay.com https://*.naver.com https://*.naverpay.com https://*.tosspayments.com https://*.toss.im",
      "frame-src 'self' https://*.portone.io https://*.kakaopay.com https://*.naverpay.com https://*.tosspay.com https://*.tosspayments.com https://*.toss.im https://*.kakao.com https://*.naver.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

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
          { key: "Content-Security-Policy", value: csp },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          // 검색엔진 스니펫에 너무 많이 노출되지 않도록 (정책 페이지 등)
          { key: "X-Robots-Tag", value: "index, follow, noarchive, max-snippet:160" },
        ],
      },
      {
        // API 응답은 캐시하지 않음 — 프록시/CDN/브라우저 캐시 차단
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
        ],
      },
    ];
  },
};

export default nextConfig;
