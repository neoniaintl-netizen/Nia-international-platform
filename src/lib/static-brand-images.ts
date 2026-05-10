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
  // Phase 4 Playwright 추출 — Shopify sitemap_products_1.xml + cafe24 sitemap.xml의 og:image
  markandlona: {
    APPAREL_TOP: [
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/Untitled-4_8b7df6a4-46d3-450e-b92e-565691b4ec9f.jpg?v=1762925627",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLM-5C-AA01_OWHT-1_9383e951-873f-4552-afbd-026743fbfc24.jpg?v=1753079138",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLW-5C-AA01_BLK-1.jpg?v=1753081840",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLW-5C-AA03_WHT-1.jpg?v=1753241457",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLM-5C-AP02_GRN-1.jpg?v=1753411777",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLW-5C-AP02_SAX-1.jpg?v=1753951880",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLM-5C-AP01_NATURAL-1.jpg?v=1753951776",
    ],
    APPAREL_BOTTOM: [
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MCW-5C-AE50_BLK-1.jpg?v=1753951005",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLW-5C-AT01_BLK-1.jpg?v=1754296389",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLW-5C-AE02_PINK-1.jpg?v=1754296322",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLM-5C-AT03_BEIGE-1.jpg?v=1755158997",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLW-5C-AE03_WHT-1.jpg?v=1755159452",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLM-5C-AT02_BLUE-1.jpg?v=1755507745",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MCM-5C-AT53_BLK-1.jpg?v=1755746630",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLM-5C-AT07_GRY-1.jpg?v=1756178262",
    ],
    APPAREL_OUTER: [
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLM-5C-AC02_BLK-1.jpg?v=1755159202",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLM-5C-AD01_GRY-1.jpg?v=1756365261",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLM-5C-AC04_WHT-1.jpg?v=1756977151",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/Untitled-2_4dd4ee30-a119-40fc-958f-4b5aac86c43c.jpg?v=1757994835",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLM-5C-AD04_O_WHT-1.jpg?v=1758677409",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLM-5C-AD03_GRY-1.jpg?v=1758876881",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/LR3XV73F_BK__01.jpg?v=1759382458",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/LR3IV75F_BK__01.jpg?v=1759383936",
    ],
    HEADWEAR: [
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLF-5C-FC05_BLK-1.jpg?v=1753952627",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLF-5C-FC04_BEI-1.jpg?v=1753952455",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLF-5C-FC01_BLK-1.jpg?v=1753952384",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MFF-5C-FC01_WHT-1.jpg?v=1753952128",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLF-5C-FC03_BEI-1.jpg?v=1753952024",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLF-5C-FC13_BLK-1.jpg?v=1755508012",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLF-5C-FC08_GRY-1.jpg?v=1755667785",
    ],
    SHOES: [
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/240523__3793.jpg?v=1717551483",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLS-5C-SS21_WHT-16_0f8e42a0-f1af-4897-9f8d-b6e1b498b7d2.jpg?v=1758684492",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLS-5C-SS21_WHT-16_a011092e-1432-4ac3-aa59-57a152d03900.jpg?v=1757656537",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLF-6A-FS11_BLK-1.jpg?v=1768790128",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/LS2ZO97U_WH_1.jpg?v=1772528883",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/LY7ZK22M_WH_1.jpg?v=1773280423",
    ],
    ACCESSORY: [
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/LY7YGY3F_CA_1.jpg?v=1693564861",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLS-4A-SZ04_BLK-1.jpg?v=1707786337",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MCF-5C-FS71_WHT-1.jpg?v=1753410799",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLF-5C-FS34_BLK-1.jpg?v=1753410403",
    ],
    BAG: [
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLS-5C-SB22_BLK-1.jpg?v=1763105403",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MFS-6A-SB02_LEOPARD-1.jpg?v=1773220829",
      "https://cdn.shopify.com/s/files/1/0686/9198/4701/files/MLS-6A-SB32_WHT-1.jpg?v=1777448918",
    ],
  },
  utaa: {
    APPAREL_TOP: [
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202103/41da9328cabc42fd67e2f236d3cd7d77.jpg",
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202104/f051868768e70d8b5a078800537bbe12.jpg",
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202106/1f1b48d41180037e8ec75d921c5e4adb.jpg",
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202107/9acf3d3a9746e8996fb7fa81a5c13dc8.jpg",
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202107/6a11f8d00bb772e2700d9c03305fc64b.jpg",
    ],
    APPAREL_BOTTOM: [
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202104/8a2b4aa6a88638948edb71915fd1528a.jpg",
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202104/0680d3a324580f346ebf699d831553dd.jpg",
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202105/79b603dadec344d64fac485c1e2b2468.jpg",
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202107/f463e8fd7bb47649ed2cd456e4c8d7e9.jpg",
    ],
    APPAREL_OUTER: [
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202104/13a6a88d301cbd19a174258bd08c4d25.jpg",
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202110/16f48cfdb99830bf5b6b616f57f6bc87.jpg",
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202111/2eb773253c494cdf839a79966eb6cd5b.jpg",
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202112/1e6d5e4fb5fb96d65afedacd73d267f7.webp",
    ],
    APPAREL_DRESS: [
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202305/9c7c51cefd7f8445cf94fd21c14f15f9.jpg",
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202305/2888b68b1c0b7ffab6a88d406aaad181.jpg",
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202406/6641cb4c234e8c8ddc9286cc9a695af0.jpg",
    ],
    HEADWEAR: [
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202104/abf4bb2574a090bb969d8981746b8884.jpg",
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202104/ed075659df041290d31450bc310b7082.jpg",
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202108/f1a8dd98d5c5936a245420057f9dcdd4.jpg",
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202111/6ee2630ceffa943e01e4a50f863b9966.jpg",
    ],
    SHOES: [
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202108/db3cce2272f5c5b2508c57d689c658a1.jpg",
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202112/696f62e99d863e91242d30cc22aa7ab7.jpg",
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202205/1a6bd984cd1779404cafc9a4fac34c19.jpg",
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202206/da884f252a70a46bdb1c9128a14c3246.jpg",
    ],
    ACCESSORY: [
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202105/fa1339159d4d2bf6429d37860341ec2c.jpg",
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202106/017b60b21b7957662090bad7c5ca9ec3.jpg",
    ],
    BAG: [
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202202/df2e494e6e183a367037d009fdd031f5.jpg",
      "https://cafe24.poxo.com/ec01/utaagolf/YepDBcpQi6F1EGuL9rzRwdaOu2hNT6sydIwDAlj0c1in22QJCI3s6HqvC9iTNUlDUUUrNzGr2Xl1nthZ1CHLmg==/_/web/product/big/202202/cffd058bc3419ade473af725e171842b.jpg",
    ],
  },
  anew: {
    APPAREL_TOP: [
      "https://cafe24img.poxo.com/sampar/web/product/big/202511/d9264da7eaf0072c3c97ea0ea99eee1c.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202601/a0ecbf92710f538d64245c5219b04fa3.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202511/02c94d9df6ebc15fcdf41035db89a6ac.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202511/ca1337c5daae6971477121cbc2e05a94.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202512/ff752bd898d5605fe069cdcf1dfc35ba.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202512/f246bc34b26111ca113bbf2d656dc2fb.jpg",
    ],
    APPAREL_BOTTOM: [
      "https://cafe24img.poxo.com/sampar/web/product/big/202601/2e1a7adcfafff8a5619c48ac646856d9.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202601/424d83f8ec8d6ba9c885dcea8b149174.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202511/250e9b71cb3fb9a8b77e5dba6e02f581.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202604/9fd9575e8779101b311f6da3e6f19c85.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202604/76e7bc06629bd7b99026a36fe05e2080.jpg",
    ],
    APPAREL_OUTER: [
      "https://cafe24img.poxo.com/sampar/web/product/big/202601/344ed3d41ca45b2de5577b4e979b459c.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202601/f25570ba8779b1669e741d09cb15855f.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202601/0ee552b337f41fba9606cceecd968f45.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202510/8396cd1daf4c332bc2a741f96458e310.jpg",
    ],
    APPAREL_DRESS: [
      "https://cafe24img.poxo.com/sampar/web/product/big/202511/709d37bd780143259e436a5f26344d4c.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202511/ac7f1a91a7c48a1c4cb6bd78ac1ca2b0.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202511/387c2a772b1f62d416a77a9d66be7244.jpg",
    ],
    HEADWEAR: [
      "https://cafe24img.poxo.com/sampar/web/product/big/202510/7c88909c474d49ae9ff7285767df5544.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202604/cbc8f94ea962ee62f2cb733c84e0f8b5.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202512/9e4fd0b71168c2f580cd1ef304290e4b.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202511/19507e28b99ced2de9ac138104bc9760.jpg",
    ],
    SHOES: [
      "https://cafe24img.poxo.com/sampar/web/product/big/202510/a8b461be7aa5e4592db1185f4f1ed7ee.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202511/b0a1569b20dcc594d588e2102c91776d.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202511/c2e35783b5b854ec3362a1111dff0280.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202511/d85b622e5264808b8b233903dcb0bc38.jpg",
    ],
    BAG: [
      "https://cafe24img.poxo.com/sampar/web/product/big/202511/d7e6d4aeb92add22b56f108873ee2209.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202604/9eb8ad2af17e2d5d5810853e2ce4f30d.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202604/69eb96065055a7012c3813ad507cb7ce.jpg",
    ],
    ACCESSORY: [
      "https://cafe24img.poxo.com/sampar/web/product/big/202511/82307b9d3be5ba367aa4c4805fb7c3b1.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202604/8a8a4ca4e465debece04c8b769a62d90.jpg",
    ],
    GOLF_BAG: [
      "https://cafe24img.poxo.com/sampar/web/product/big/202605/3127b6aeb62b64ad31318b65489c7bf8.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202605/f85058795d560bdb690c98117cd487ac.jpg",
      "https://cafe24img.poxo.com/sampar/web/product/big/202605/ee65e2c387800347d5552361a8313c4f.jpg",
    ],
  },
  // 추출 실패/시도 안 한 brand들
  patagonia: {},
  arcteryx: {},
  descente: {},
  "nike-skims": {},
  pelt: {},
  iceberg: {},
  gfore: {},
  thecart: {},
  southcape: {},
};
