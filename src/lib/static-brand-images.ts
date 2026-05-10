/**
 * 9개 브랜드 사이트에서 로컬에서 직접 추출한 진짜 product 이미지 URL 풀.
 *
 * 추출 시점: 2026-05-10 (정밀 추출 v2)
 * 추출 방법: scripts/extract-precise-images.mjs
 *   - Shopify 기반 (salomon, wilson): products.json API
 *   - Aloyoga: 글로벌 sitemap_products_1.xml (image:loc + image:title)
 *   - The North Face: cmsstatic/product/* 패턴 selector
 *   - Kolon Sport: images3.kolonmall.com 패턴 selector
 *
 * 정밀도:
 * - salomon: 12개 진짜 product (S262001HPH47 등 SKU 색상별)
 * - wilson: 12개 진짜 product (WBW10258 등 SKU)
 * - thenorthface: 12개 진짜 product (NV5VS03* 다양한 SKU 색상별)
 * - aloyoga: 12개 진짜 product (W5434R, W5473R 등 sitemap에서 추출)
 * - kolonsport: 4개 product + 1개 SVG 로고 혼재
 * - 나머지(patagonia, arcteryx, descente, nike-skims): SPA/구조 차이로 추출 어려움
 */

export const STATIC_BRAND_IMAGES: Record<string, string[]> = {
  // Shopify products.json — 진짜 product SKU 색상별
  salomon: [
    "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262001HPH47_MHG_01.jpg?v=1777451642",
    "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262001HPH47_BLK_01.jpg?v=1777451622",
    "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262001HPH47_LGR_01.jpg?v=1777451633",
    "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262002HSL51_BUC_01.jpg?v=1777451869",
    "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262002HSL51_BLK_01.jpg?v=1777451880",
    "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262001HTS56_CCH_01.jpg?v=1777452029",
    "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262001HTS56_BUC_01.jpg?v=1777452216",
    "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262001HTS56_WHT_01.jpg?v=1777452246",
    "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262002HTS53_MHG_01.jpg?v=1777452342",
    "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262002HTS53_WHT_01.jpg?v=1777452352",
    "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262001HSL51_WHT_01.jpg?v=1777452425",
    "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262001HSL51_BLK_01.jpg?v=1777452436",
  ],
  // 자체 사이트라 SPA. 추출 어려움
  patagonia: [],
  // 추출 실패
  arcteryx: [],
  // cmsstatic/product/* 패턴
  thenorthface: [
    "https://image.thenorthfacekorea.co.kr/cmsstatic/product/4000059026/NV5VS03E_NV5VS03E_primary-1.jpg?browse",
    "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03E_NV5VS03E_01.jpg?browse",
    "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03E_NV5VS03E_02.jpg?browse",
    "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03E_NV5VS03E_03.jpg?browse",
    "https://image.thenorthfacekorea.co.kr/cmsstatic/product/4000059024/NV5VS03D_NV5VS03D_primary-1.jpg?browse",
    "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03D_NV5VS03D_01.jpg?browse",
    "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03D_NV5VS03D_02.jpg?browse",
    "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03D_NV5VS03D_03.jpg?browse",
    "https://image.thenorthfacekorea.co.kr/cmsstatic/product/4000059023/NV5VS03C_NV5VS03C_primary-1.jpg?browse",
    "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03C_NV5VS03C_01.jpg?browse",
    "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03C_NV5VS03C_02.jpg?browse",
    "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03C_NV5VS03C_03.jpg?browse",
  ],
  // images3.kolonmall.com 패턴 (SVG 로고 1개 제외)
  kolonsport: [
    "https://images3.kolonmall.com/upload/content/904c9a14-7ebf-4832-90f7-260cb74d1ac0/5e7d5b41-39ee-4cff-b76a-d68adaf7335f.jpg?q=80",
    "https://images3.kolonmall.com/upload/content/2bb1c76e-ec6d-4d08-8df5-d09925e2d39d/cf0ffd12-d31b-411f-aba2-672e7cee95ce.webp?q=80",
    "https://images3.kolonmall.com/upload/content/cd2a6c16-6963-4161-8c50-49a06092647d/d14a503e-db27-41db-883c-623c5731cdae.jpg?q=80",
    "https://images3.kolonmall.com/upload/content/a16c871e-aa9e-4d26-b368-aca844d67064/7b3e8524-394e-4b70-aeaa-41687ceba886.jpg?q=80",
  ],
  // SPA로 SSR 추출 어려움. 마케팅 배너만
  descente: [],
  // Shopify products.json — 진짜 product 글러브/장비
  wilson: [
    "https://cdn.shopify.com/s/files/1/0576/0227/7429/files/WBW102581_0_A1000_DW5_IF_12_Blonde_Teal_Orange.png?v=1752474702",
    "https://cdn.shopify.com/s/files/1/0576/0227/7429/files/WBW102585_0_A1000_1750_OF_125_Black_Grey.png?v=1752474776",
    "https://cdn.shopify.com/s/files/1/0576/0227/7429/files/WBW102583_0_A1000_1892_w_Pedroia_Fit_OF_1225_Black_Royal.png?v=1752474486",
    "https://cdn.shopify.com/s/files/1/0576/0227/7429/files/W262001NPH41FAL_01.png?v=1777870954",
    "https://cdn.shopify.com/s/files/1/0576/0227/7429/files/W262001NJA43ICE_01.png?v=1777870700",
    "https://cdn.shopify.com/s/files/1/0576/0227/7429/files/WBW104607_0_2026_SUMMER_A2000FP_H12_Bld_Lav_Pu_12_BLONDE_LAVENDER_PURPLE.png?v=1777877371",
    "https://cdn.shopify.com/s/files/1/0576/0227/7429/files/WBW104599_0_2026_SUMMER_A2000_1750SS_Black_Opt_125_BLACK_OPTICYELLOW.png?v=1777877087",
    "https://cdn.shopify.com/s/files/1/0576/0227/7429/files/WBW104595_0_2026_SUMMER_A2000_1786_CHERRY_BLOS_115_PINK_WHITE.png?v=1777876953",
  ],
  // 글로벌 sitemap에서 추출한 진짜 product 이미지 (legging/hoodie/sweatshirt/bra 키워드)
  aloyoga: [
    "https://cdn.shopify.com/s/files/1/2185/2813/products/W5434R_00785_b1_s1_a1_1_M70.jpg?v=1628724326",
    "https://cdn.shopify.com/s/files/1/2185/2813/files/W5473R_02125_b1_s1_a1_1_m224.jpg?v=1741636256",
    "https://cdn.shopify.com/s/files/1/2185/2813/products/W5525R_0101_b1_s1_a1_1_m54.jpg?v=1664317674",
    "https://cdn.shopify.com/s/files/1/2185/2813/files/W5630R_01_b2_s1_a1_dSP26_m242.jpg?v=1770056719",
    "https://cdn.shopify.com/s/files/1/2185/2813/files/W6145R_01_b1_s1_a1_1_m54.jpg?v=1731646890",
    "https://cdn.shopify.com/s/files/1/2185/2813/files/W4493R_01660_b1_s1_a1_1_m206.jpg?v=1731610831",
    "https://cdn.shopify.com/s/files/1/2185/2813/files/W4493R_01_b2_s1_a1_1_m176.jpg?v=1769643878",
    "https://cdn.shopify.com/s/files/1/2185/2813/files/W9218R_01_b1_s1_a4_dSP26_m18.jpg?v=1771614803",
    "https://cdn.shopify.com/s/files/1/2185/2813/files/W3438R_01_b1_s1_a1_1_m191.jpg?v=1741289828",
    "https://cdn.shopify.com/s/files/1/2185/2813/files/W5604R_00_b2_s1_a1_1_m196.jpg?v=1773867842",
    "https://cdn.shopify.com/s/files/1/2185/2813/files/W9291R_01_b1_s1_a1_1_m54.jpg?v=1714151429",
    "https://cdn.shopify.com/s/files/1/2185/2813/files/W5475R_00_b1_s1_a7_m125.jpg?v=1757190896",
  ],
  // SPA 사이트 + 메인 페이지가 농구화/운동화(jordan/kobe/airmax) 위주라 의류 product에 부적합 → 빈 배열
  "nike-skims": [],
  // PXG 글로벌 사이트(www.pxg.com)는 Shopify 기반이라 sitemap_products_1.xml에서
  // 진짜 의류(Polo/Sleeve/Cap/Vest 등) 이미지 추출 (legacy 호환)
  pxg: [
    "https://cdn.shopify.com/s/files/1/0664/5543/7486/files/Mens-Athletic-Fit-Hole-in-One-Polo-Lay-Flat-50.jpg?v=1757521441",
    "https://cdn.shopify.com/s/files/1/0664/5543/7486/files/Mens-Tour-Comfort-Fit-Crossed-Driver-Polo-White-Side-50_630ffab0-0de5-4400-b3e8-77af21e284c6.jpg?v=1763504049",
    "https://cdn.shopify.com/s/files/1/0664/5543/7486/files/Mens-Athletic-Fit-Crisscross-Print-Polo-Lay-Flat-50.jpg?v=1757521730",
    "https://cdn.shopify.com/s/files/1/0664/5543/7486/files/Mens-Comfort-Fit-Fineline-Polo-Black-Lay-Flat-Shopify.jpg?v=1757546332",
    "https://cdn.shopify.com/s/files/1/0664/5543/7486/files/Mens-Tour-Comfort-Fit-Pin-Flag-Polo-Hunter-Green-Front-50.jpg?v=1755712735",
    "https://cdn.shopify.com/s/files/1/0664/5543/7486/files/CM-MF24ATP1-07C-Mens-Comfort-Fit-Golf-Icons-Pin-Stripe-Polo-Black-Front-50_3701b1a3-7955-457c-ae87-966a18423d56.jpg?v=1773231215",
    "https://cdn.shopify.com/s/files/1/0664/5543/7486/files/Womens-RP-Signature-Polo-Dress-Lay-Flat-Shopify.jpg?v=1757538831",
    "https://cdn.shopify.com/s/files/1/0664/5543/7486/files/CM-ME23ATP1-Womens-Cactus-Print-Polo-Black-Lay-Flat-50.jpg?v=1757540929",
  ],
};

import type { ProductType } from "./server-init/product-type";

/**
 * brand별 × type별 이미지 풀.
 * cleanup-mismatch가 product의 type에 맞는 풀에서 라운드로빈 매핑.
 *
 * 추출 시점: 2026-05-10
 * - Shopify products.json 또는 sitemap에서 image:title 키워드로 type bucket
 * - cafe24/SPA 사이트는 Phase 4 Playwright 추출 결과로 채움 (현재는 빈 배열)
 */
export const STATIC_BRAND_IMAGES_BY_TYPE: Record<
  string,
  Partial<Record<ProductType, string[]>>
> = {
  // ─── Shopify 기반 — products.json/sitemap에서 정확 추출 ───
  salomon: {
    SHOES: [
      "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262001HPH47_MHG_01.jpg?v=1777451642",
      "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262001HPH47_BLK_01.jpg?v=1777451622",
      "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262001HPH47_LGR_01.jpg?v=1777451633",
      "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262002HSL51_BUC_01.jpg?v=1777451869",
      "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262002HSL51_BLK_01.jpg?v=1777451880",
      "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262001HTS56_CCH_01.jpg?v=1777452029",
      "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262001HTS56_BUC_01.jpg?v=1777452216",
      "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262001HTS56_WHT_01.jpg?v=1777452246",
      "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262002HTS53_MHG_01.jpg?v=1777452342",
      "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262002HTS53_WHT_01.jpg?v=1777452352",
      "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262001HSL51_WHT_01.jpg?v=1777452425",
      "https://cdn.shopify.com/s/files/1/0580/9035/6875/files/S262001HSL51_BLK_01.jpg?v=1777452436",
    ],
  },
  thenorthface: {
    APPAREL_OUTER: [
      "https://image.thenorthfacekorea.co.kr/cmsstatic/product/4000059026/NV5VS03E_NV5VS03E_primary-1.jpg?browse",
      "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03E_NV5VS03E_01.jpg?browse",
      "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03E_NV5VS03E_02.jpg?browse",
      "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03E_NV5VS03E_03.jpg?browse",
      "https://image.thenorthfacekorea.co.kr/cmsstatic/product/4000059024/NV5VS03D_NV5VS03D_primary-1.jpg?browse",
      "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03D_NV5VS03D_01.jpg?browse",
      "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03D_NV5VS03D_02.jpg?browse",
      "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03D_NV5VS03D_03.jpg?browse",
      "https://image.thenorthfacekorea.co.kr/cmsstatic/product/4000059023/NV5VS03C_NV5VS03C_primary-1.jpg?browse",
      "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03C_NV5VS03C_01.jpg?browse",
      "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03C_NV5VS03C_02.jpg?browse",
      "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03C_NV5VS03C_03.jpg?browse",
    ],
  },
  // Aloyoga: sitemap title 분석 결과 — Legging 시리즈는 BOTTOM, Sweatshirt/Bra는 TOP/UNDERWEAR
  aloyoga: {
    APPAREL_BOTTOM: [
      "https://cdn.shopify.com/s/files/1/2185/2813/products/W5434R_00785_b1_s1_a1_1_M70.jpg?v=1628724326",
      "https://cdn.shopify.com/s/files/1/2185/2813/files/W5473R_02125_b1_s1_a1_1_m224.jpg?v=1741636256",
      "https://cdn.shopify.com/s/files/1/2185/2813/products/W5525R_0101_b1_s1_a1_1_m54.jpg?v=1664317674",
      "https://cdn.shopify.com/s/files/1/2185/2813/files/W5630R_01_b2_s1_a1_dSP26_m242.jpg?v=1770056719",
      "https://cdn.shopify.com/s/files/1/2185/2813/files/W6145R_01_b1_s1_a1_1_m54.jpg?v=1731646890",
      "https://cdn.shopify.com/s/files/1/2185/2813/files/W5604R_00_b2_s1_a1_1_m196.jpg?v=1773867842",
      "https://cdn.shopify.com/s/files/1/2185/2813/files/W5475R_00_b1_s1_a7_m125.jpg?v=1757190896",
    ],
    APPAREL_TOP: [
      "https://cdn.shopify.com/s/files/1/2185/2813/files/W4493R_01660_b1_s1_a1_1_m206.jpg?v=1731610831",
      "https://cdn.shopify.com/s/files/1/2185/2813/files/W4493R_01_b2_s1_a1_1_m176.jpg?v=1769643878",
      "https://cdn.shopify.com/s/files/1/2185/2813/files/W3438R_01_b1_s1_a1_1_m191.jpg?v=1741289828",
      "https://cdn.shopify.com/s/files/1/2185/2813/files/W9291R_01_b1_s1_a1_1_m54.jpg?v=1714151429",
    ],
    UNDERWEAR: [
      "https://cdn.shopify.com/s/files/1/2185/2813/files/W9218R_01_b1_s1_a4_dSP26_m18.jpg?v=1771614803",
    ],
  },
  // Wilson: products.json — A1000* 글러브 + W262001N* 의류 outer
  wilson: {
    ACCESSORY: [
      "https://cdn.shopify.com/s/files/1/0576/0227/7429/files/WBW102581_0_A1000_DW5_IF_12_Blonde_Teal_Orange.png?v=1752474702",
      "https://cdn.shopify.com/s/files/1/0576/0227/7429/files/WBW102585_0_A1000_1750_OF_125_Black_Grey.png?v=1752474776",
      "https://cdn.shopify.com/s/files/1/0576/0227/7429/files/WBW102583_0_A1000_1892_w_Pedroia_Fit_OF_1225_Black_Royal.png?v=1752474486",
      "https://cdn.shopify.com/s/files/1/0576/0227/7429/files/WBW104607_0_2026_SUMMER_A2000FP_H12_Bld_Lav_Pu_12_BLONDE_LAVENDER_PURPLE.png?v=1777877371",
      "https://cdn.shopify.com/s/files/1/0576/0227/7429/files/WBW104599_0_2026_SUMMER_A2000_1750SS_Black_Opt_125_BLACK_OPTICYELLOW.png?v=1777877087",
      "https://cdn.shopify.com/s/files/1/0576/0227/7429/files/WBW104595_0_2026_SUMMER_A2000_1786_CHERRY_BLOS_115_PINK_WHITE.png?v=1777876953",
    ],
    APPAREL_OUTER: [
      "https://cdn.shopify.com/s/files/1/0576/0227/7429/files/W262001NPH41FAL_01.png?v=1777870954",
      "https://cdn.shopify.com/s/files/1/0576/0227/7429/files/W262001NJA43ICE_01.png?v=1777870700",
    ],
  },
  kolonsport: {
    APPAREL_TOP: [
      "https://images3.kolonmall.com/upload/content/904c9a14-7ebf-4832-90f7-260cb74d1ac0/5e7d5b41-39ee-4cff-b76a-d68adaf7335f.jpg?q=80",
      "https://images3.kolonmall.com/upload/content/2bb1c76e-ec6d-4d08-8df5-d09925e2d39d/cf0ffd12-d31b-411f-aba2-672e7cee95ce.webp?q=80",
      "https://images3.kolonmall.com/upload/content/cd2a6c16-6963-4161-8c50-49a06092647d/d14a503e-db27-41db-883c-623c5731cdae.jpg?q=80",
      "https://images3.kolonmall.com/upload/content/a16c871e-aa9e-4d26-b368-aca844d67064/7b3e8524-394e-4b70-aeaa-41687ceba886.jpg?q=80",
    ],
  },
  // PXG 글로벌 sitemap 추출 — Polo는 GOLF_APPAREL/APPAREL_TOP, Polo Dress는 APPAREL_DRESS
  pxg: {
    GOLF_APPAREL: [
      "https://cdn.shopify.com/s/files/1/0664/5543/7486/files/Mens-Athletic-Fit-Hole-in-One-Polo-Lay-Flat-50.jpg?v=1757521441",
      "https://cdn.shopify.com/s/files/1/0664/5543/7486/files/Mens-Tour-Comfort-Fit-Crossed-Driver-Polo-White-Side-50_630ffab0-0de5-4400-b3e8-77af21e284c6.jpg?v=1763504049",
      "https://cdn.shopify.com/s/files/1/0664/5543/7486/files/Mens-Athletic-Fit-Crisscross-Print-Polo-Lay-Flat-50.jpg?v=1757521730",
      "https://cdn.shopify.com/s/files/1/0664/5543/7486/files/Mens-Comfort-Fit-Fineline-Polo-Black-Lay-Flat-Shopify.jpg?v=1757546332",
      "https://cdn.shopify.com/s/files/1/0664/5543/7486/files/Mens-Tour-Comfort-Fit-Pin-Flag-Polo-Hunter-Green-Front-50.jpg?v=1755712735",
      "https://cdn.shopify.com/s/files/1/0664/5543/7486/files/CM-MF24ATP1-07C-Mens-Comfort-Fit-Golf-Icons-Pin-Stripe-Polo-Black-Front-50_3701b1a3-7955-457c-ae87-966a18423d56.jpg?v=1773231215",
      "https://cdn.shopify.com/s/files/1/0664/5543/7486/files/CM-ME23ATP1-Womens-Cactus-Print-Polo-Black-Lay-Flat-50.jpg?v=1757540929",
    ],
    APPAREL_TOP: [
      "https://cdn.shopify.com/s/files/1/0664/5543/7486/files/Mens-Athletic-Fit-Hole-in-One-Polo-Lay-Flat-50.jpg?v=1757521441",
      "https://cdn.shopify.com/s/files/1/0664/5543/7486/files/Mens-Comfort-Fit-Fineline-Polo-Black-Lay-Flat-Shopify.jpg?v=1757546332",
      "https://cdn.shopify.com/s/files/1/0664/5543/7486/files/CM-ME23ATP1-Womens-Cactus-Print-Polo-Black-Lay-Flat-50.jpg?v=1757540929",
    ],
    APPAREL_DRESS: [
      "https://cdn.shopify.com/s/files/1/0664/5543/7486/files/Womens-RP-Signature-Polo-Dress-Lay-Flat-Shopify.jpg?v=1757538831",
    ],
  },
  // Phase 4 Playwright로 채울 brand들 (현재 빈 채로 둠 — 매핑 안 됨, placeholder만)
  patagonia: {},
  arcteryx: {},
  descente: {},
  "nike-skims": {},
  utaa: {},
  pelt: {},
  anew: {},
  iceberg: {},
  gfore: {},
  thecart: {},
  southcape: {},
  markandlona: {},
};
