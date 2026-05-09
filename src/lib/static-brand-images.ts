/**
 * 9개 브랜드 사이트에서 로컬에서 직접 추출한 이미지 URL 풀.
 *
 * 추출 시점: 2026-05-10
 * 추출 방법: scripts/extract-brand-images.mjs (한국 IP, cheerio 기반 SSR HTML 파싱)
 *
 * 한계:
 * - 일부 브랜드(patagonia, descente, nike-skims, aloyoga)는 메인 페이지의 헤더/배너 이미지가 다수 포함됨
 *   (collection 페이지가 SPA로 JS 렌더링하기 때문)
 * - arcteryx는 페이지 구조 차이로 추출 실패 → placeholder 유지
 * - thenorthface 후반 6개, kolonsport 앞 5개, salomon/wilson 일부는 진짜 상품 이미지로 추정
 *
 * 사용처: scripts/migrate-placeholder-images.ts에서 placehold.co URL을
 *  여기 정의된 진짜 URL로 라운드로빈 매핑
 */

export const STATIC_BRAND_IMAGES: Record<string, string[]> = {
  salomon: [
    "https://salomon.co.kr/cdn/shop/files/featured.jpg?format=pjpg&v=1775196716&width=500",
    "https://salomon.co.kr/cdn/shop/files/dsdasd_3.png?format=pjpg&v=1773111421&width=500",
    "https://salomon.co.kr/cdn/shop/files/GNB_750x500_1_2.jpg?format=pjpg&v=1776844219&width=500",
    "https://salomon.co.kr/cdn/shop/files/Media_LART_Silhouettes_Desktop.jpg?format=pjpg&v=1776655761&width=500",
    "https://salomon.co.kr/cdn/shop/files/SALOMON_HISTORY.png?format=pjpg&v=1773110508&width=500",
    "https://salomon.co.kr/cdn/shop/files/WHO_WE_ARE_0a71195b-092e-4fca-b018-afd9456612df.png?format=pjpg&v=1773110510&width=500",
    "https://salomon.co.kr/cdn/shop/files/9c0fc4c10bfa322fbe4aebc6b32e8ee6.jpg?format=pjpg&v=1744880608&width=500",
    "https://salomon.co.kr/cdn/shop/files/2026-01-06T092520.912.png?format=pjpg&v=1767659161&width=500",
    "https://salomon.co.kr/cdn/shop/files/b67e3fd742dc34e4c73ba36b8f5ef383.jpg?format=pjpg&v=1744880608&width=500",
  ],
  patagonia: [
    "https://www.patagonia.co.kr/assets/templet/enterprise/images/main/img_header_cleanstline.jpg",
    "https://www.patagonia.co.kr/assets/templet/enterprise/images/main/img_header_social.jpg",
    "https://www.patagonia.co.kr/assets/templet/enterprise/images/common/patagonia_og.jpg",
  ],
  arcteryx: [
    // 추출 실패 — 후속 작업 필요. 빈 배열은 마이그레이션에서 건너뜀.
  ],
  thenorthface: [
    "https://image.thenorthfacekorea.co.kr/cmsstatic/product/4000059026/NV5VS03E_NV5VS03E_primary-1.jpg?browse",
    "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03E_NV5VS03E_01.jpg?browse",
    "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03E_NV5VS03E_02.jpg?browse",
    "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03E_NV5VS03E_03.jpg?browse",
    "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03E_NV5VS03E_04.jpg?browse",
    "https://image.thenorthfacekorea.co.kr/cmsstatic/product/NV5VS03E_NV5VS03E_05.jpg?browse",
  ],
  kolonsport: [
    "https://images3.kolonmall.com/upload/content/2f780358-9050-4027-b777-1a8807079635/ks.jpg",
    "https://images3.kolonmall.com/upload/content/904c9a14-7ebf-4832-90f7-260cb74d1ac0/5e7d5b41-39ee-4cff-b76a-d68adaf7335f.jpg?q=80",
    "https://images3.kolonmall.com/upload/content/2bb1c76e-ec6d-4d08-8df5-d09925e2d39d/cf0ffd12-d31b-411f-aba2-672e7cee95ce.webp?q=80",
    "https://images3.kolonmall.com/upload/content/cd2a6c16-6963-4161-8c50-49a06092647d/d14a503e-db27-41db-883c-623c5731cdae.jpg?q=80",
    "https://images3.kolonmall.com/upload/content/a16c871e-aa9e-4d26-b368-aca844d67064/7b3e8524-394e-4b70-aeaa-41687ceba886.jpg?q=80",
  ],
  descente: [
    "https://img.dk-on.com/contents/disp/Builder/Unit/20260430/260430_PC_GNB_MEN1_20260430111556.jpg",
    "https://img.dk-on.com/contents/disp/Builder/Unit/20260430/260430_PC_GNB_MEN2_20260430111607.jpg",
    "https://img.dk-on.com/contents/disp/Builder/Unit/20260430/260430_PC_GNB_WOMEN1_20260430111619.jpg",
    "https://img.dk-on.com/contents/disp/Builder/Unit/20260430/260430_PC_GNB_WOMEN2_20260430111628.jpg",
    "https://img.dk-on.com/contents/disp/Builder/Unit/20260430/260430_PC_GNB_SHOES1_20260430111636.jpg",
    "https://img.dk-on.com/contents/disp/Builder/Unit/20260430/260430_PC_GNB_SHOES2_20260430111643.jpg",
  ],
  wilson: [
    "https://kr.wilson.com/cdn/shop/files/W262008LSA50WED_01_%7Bwidth%7Dx.png?v=1777426717&width=800",
    "https://kr.wilson.com/cdn/shop/files/W262008LSA50BLK_01_%7Bwidth%7Dx.png?v=1777426675&width=800",
    "https://kr.wilson.com/cdn/shop/files/W260108TTE51WGN_01_f817edb6-a94c-47c1-a9cd-8764bd945449_%7Bwidth%7Dx.png?v=1776840215&width=800",
    "https://kr.wilson.com/cdn/shop/files/W260108TTE50RGS_01_e0e908db-90b7-4bb4-b820-665bda0e2a75_%7Bwidth%7Dx.png?v=1776323200&width=800",
    "https://kr.wilson.com/cdn/shop/files/W261009LCR20WHT_01_%7Bwidth%7Dx.png?v=1776660705&width=800",
    "https://kr.wilson.com/cdn/shop/files/226320dde7ff8498a3244e3d03896594.jpg?v=1746774252&width=800",
    "https://kr.wilson.com/cdn/shop/files/3_8e4a1918-68ff-4877-91cf-18f219dd54f5.jpg?v=1776824738&width=800",
    "https://kr.wilson.com/cdn/shop/files/ecf40d9fd70fa7ca2eac65fc7ece5242.jpg?v=1746774252&width=800",
  ],
  aloyoga: [
    "https://www.aloyoga.com/cdn/shop/files/SITE___3.2___NingNing_KR_HP_HERO-3_2_small.jpg?v=1775082109",
    "https://www.aloyoga.com/cdn/shop/files/SITE___3.2___NingNing_KR_HP_HERO-2_small.jpg?v=1775081627",
    "https://www.aloyoga.com/cdn/shop/files/desktop_BIS_alt_v1_300x.jpg?v=1778267048",
    "https://www.aloyoga.com/cdn/shop/files/desktop_BIS_alt_v1_small.jpg?v=1778267048",
    "https://www.aloyoga.com/cdn/shop/files/bestsellersstorycardpostsale_a9fa0021-e434-4d38-a875-36e4abcd597c_small.png?v=1778270278",
    "https://www.aloyoga.com/cdn/shop/files/Storycard-3_7_small.jpg?v=1775767536",
    "https://www.aloyoga.com/cdn/shop/files/sweatshirtsstorycard_b976d5a6-963c-4986-ae4a-71ccd0e7e0fa_small.png?v=1775772119",
    "https://www.aloyoga.com/cdn/shop/files/TN_sets_story_card_small.jpg?v=1777580622",
    "https://www.aloyoga.com/cdn/shop/files/affectionstorycard_small.png?v=1776376495",
  ],
  "nike-skims": [
    "https://static.nike.com/a/images/t_prod_pc/w_960,c_limit,q_auto,f_auto/b25e0dad-a209-423a-a1d6-639599dfbc66/jordan.jpg",
    "https://static.nike.com/a/images/t_prod_pc/w_960,c_limit,q_auto,f_auto/d70455c0-6e48-439e-8544-97276fd07138/react.jpg",
    "https://static.nike.com/a/images/t_prod_pc/w_960,c_limit,q_auto,f_auto/175ae4a5-13de-4d8e-af7b-3e78b13aff7c/sb-dunk.jpg",
    "https://static.nike.com/a/images/t_prod_pc/w_960,c_limit,q_auto,f_auto/6eb0ece2-d2e7-42fc-a050-0ef65b00e6ab/kobe-3.jpg",
    "https://static.nike.com/a/images/t_prod_pc/w_960,c_limit,q_auto,f_auto/868bbd83-c38a-46a3-8ac2-a917da1ab196/jordan-3.jpg",
    "https://static.nike.com/a/images/t_prod_pc/w_960,c_limit,q_auto,f_auto/2a2c4ef8-a88a-4160-9ef0-d0071f235a6e/airmax-95.jpg",
    "https://static.nike.com/a/images/t_prod_pc/w_960,c_limit,q_auto,f_auto/aba19d48-66e2-45a4-a5c1-4750b6ab3940/kobe-11.jpg",
    "https://static.nike.com/a/images/t_prod_pc/w_960,c_limit,q_auto,f_auto/4290d5f9-a02c-4cbd-b8db-95fb1941eed2/kobe-1.jpg",
  ],
};
