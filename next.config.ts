import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "image.musinsa.com",
      },
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
    // lucide-react 트리쉐이킹 강화 (1500개 중 82개만 사용)
    optimizePackageImports: ["lucide-react", "@base-ui/react"],
  },
};

export default nextConfig;
