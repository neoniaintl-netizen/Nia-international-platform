import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── 프로덕션 최적화 ──
  output: "standalone", // node_modules 없이 자체 완결 빌드 (~80MB)

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
