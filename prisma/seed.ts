import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, ProductStatus, CrawlStatus, ReleaseStatus } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Clean existing data ───
  await prisma.$transaction([
    prisma.productTag.deleteMany(),
    prisma.productInquiry.deleteMany(),
    prisma.review.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.order.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.brand.deleteMany(),
    prisma.banner.deleteMany(),
    prisma.magazine.deleteMany(),
    prisma.snap.deleteMany(),
    prisma.release.deleteMany(),
    prisma.crawlJob.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.address.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // ═══════════════════════════════════════
  // 1. BRANDS
  // ═══════════════════════════════════════
  const brands = await Promise.all([
    prisma.brand.create({
      data: {
        name: "MUSINSA STANDARD",
        nameKo: "무신사 스탠다드",
        slug: "musinsa-standard",
        logoUrl: "https://placehold.co/200x80/1a1a1a/ffffff?text=MUSINSA+STD",
        description: "무신사가 만든 베이직 캐주얼 브랜드. 합리적인 가격에 퀄리티 높은 기본 아이템을 제안합니다.",
        followerCount: 523400,
      },
    }),
    prisma.brand.create({
      data: {
        name: "COVERNAT",
        nameKo: "커버낫",
        slug: "covernat",
        logoUrl: "https://placehold.co/200x80/1a1a1a/ffffff?text=COVERNAT",
        description: "아메리칸 캐주얼을 기반으로 한 스트리트 브랜드.",
        followerCount: 312000,
      },
    }),
    prisma.brand.create({
      data: {
        name: "Nike",
        nameKo: "나이키",
        slug: "nike",
        logoUrl: "https://placehold.co/200x80/1a1a1a/ffffff?text=NIKE",
        description: "Just Do It.",
        followerCount: 892000,
      },
    }),
    prisma.brand.create({
      data: {
        name: "thisisneverthat",
        nameKo: "디스이즈네버댓",
        slug: "thisisneverthat",
        logoUrl: "https://placehold.co/200x80/1a1a1a/ffffff?text=thisisneverthat",
        description: "서울 기반 스트리트웨어 브랜드.",
        followerCount: 245000,
      },
    }),
    prisma.brand.create({
      data: {
        name: "MAHAGRID",
        nameKo: "마하그리드",
        slug: "mahagrid",
        logoUrl: "https://placehold.co/200x80/1a1a1a/ffffff?text=MAHAGRID",
        description: "영 스트리트 캐주얼 브랜드.",
        followerCount: 189000,
      },
    }),
    prisma.brand.create({
      data: {
        name: "ADER ERROR",
        nameKo: "아더에러",
        slug: "ader-error",
        logoUrl: "https://placehold.co/200x80/1a1a1a/ffffff?text=ADER+ERROR",
        description: "컨템포러리 패션 브랜드.",
        followerCount: 167000,
      },
    }),
    prisma.brand.create({
      data: {
        name: "adidas",
        nameKo: "아디다스",
        slug: "adidas",
        logoUrl: "https://placehold.co/200x80/1a1a1a/ffffff?text=adidas",
        description: "Impossible is Nothing.",
        followerCount: 678000,
      },
    }),
    prisma.brand.create({
      data: {
        name: "New Balance",
        nameKo: "뉴발란스",
        slug: "new-balance",
        logoUrl: "https://placehold.co/200x80/1a1a1a/ffffff?text=NEW+BALANCE",
        description: "편안함과 스타일을 동시에.",
        followerCount: 534000,
      },
    }),
    prisma.brand.create({
      data: {
        name: "IAB Studio",
        nameKo: "아이앱 스튜디오",
        slug: "iab-studio",
        logoUrl: "https://placehold.co/200x80/1a1a1a/ffffff?text=IAB+STUDIO",
        description: "감각적인 그래픽 디자인의 스트리트 브랜드.",
        followerCount: 203000,
      },
    }),
    prisma.brand.create({
      data: {
        name: "STUSSY",
        nameKo: "스투시",
        slug: "stussy",
        logoUrl: "https://placehold.co/200x80/1a1a1a/ffffff?text=STUSSY",
        description: "서프/스케이트 문화에 뿌리를 둔 스트리트웨어.",
        followerCount: 345000,
      },
    }),
    prisma.brand.create({
      data: {
        name: "KANGOL",
        nameKo: "캉골",
        slug: "kangol",
        logoUrl: "https://placehold.co/200x80/1a1a1a/ffffff?text=KANGOL",
        description: "영국 전통 헤드웨어 브랜드.",
        followerCount: 156000,
      },
    }),
    prisma.brand.create({
      data: {
        name: "CARHARTT WIP",
        nameKo: "칼하트 윕",
        slug: "carhartt-wip",
        logoUrl: "https://placehold.co/200x80/1a1a1a/ffffff?text=CARHARTT+WIP",
        description: "워크웨어를 현대적으로 재해석.",
        followerCount: 278000,
      },
    }),
  ]);

  console.log(`  ✅ ${brands.length} brands created`);

  // ═══════════════════════════════════════
  // 2. CATEGORIES (대분류 → 중분류)
  // ═══════════════════════════════════════
  const topCategories = await Promise.all([
    prisma.category.create({ data: { name: "상의", slug: "tops", depth: 0, sortOrder: 1 } }),
    prisma.category.create({ data: { name: "아우터", slug: "outerwear", depth: 0, sortOrder: 2 } }),
    prisma.category.create({ data: { name: "바지", slug: "pants", depth: 0, sortOrder: 3 } }),
    prisma.category.create({ data: { name: "원피스/스커트", slug: "dresses", depth: 0, sortOrder: 4 } }),
    prisma.category.create({ data: { name: "신발", slug: "shoes", depth: 0, sortOrder: 5 } }),
    prisma.category.create({ data: { name: "가방", slug: "bags", depth: 0, sortOrder: 6 } }),
    prisma.category.create({ data: { name: "시계/주얼리", slug: "accessories-jewelry", depth: 0, sortOrder: 7 } }),
    prisma.category.create({ data: { name: "모자/액세서리", slug: "hats-accessories", depth: 0, sortOrder: 8 } }),
  ]);

  // 상의 하위
  const subTops = await Promise.all([
    prisma.category.create({ data: { name: "반팔 티셔츠", slug: "short-sleeve-tee", depth: 1, sortOrder: 1, parentId: topCategories[0].id } }),
    prisma.category.create({ data: { name: "긴팔 티셔츠", slug: "long-sleeve-tee", depth: 1, sortOrder: 2, parentId: topCategories[0].id } }),
    prisma.category.create({ data: { name: "맨투맨/스웨트셔츠", slug: "sweatshirt", depth: 1, sortOrder: 3, parentId: topCategories[0].id } }),
    prisma.category.create({ data: { name: "후드", slug: "hoodie", depth: 1, sortOrder: 4, parentId: topCategories[0].id } }),
    prisma.category.create({ data: { name: "셔츠/블라우스", slug: "shirt", depth: 1, sortOrder: 5, parentId: topCategories[0].id } }),
    prisma.category.create({ data: { name: "니트/카디건", slug: "knit", depth: 1, sortOrder: 6, parentId: topCategories[0].id } }),
  ]);

  // 바지 하위
  const subPants = await Promise.all([
    prisma.category.create({ data: { name: "데님 팬츠", slug: "denim", depth: 1, sortOrder: 1, parentId: topCategories[2].id } }),
    prisma.category.create({ data: { name: "코튼 팬츠", slug: "cotton-pants", depth: 1, sortOrder: 2, parentId: topCategories[2].id } }),
    prisma.category.create({ data: { name: "쇼츠/반바지", slug: "shorts", depth: 1, sortOrder: 3, parentId: topCategories[2].id } }),
    prisma.category.create({ data: { name: "트레이닝/조거", slug: "jogger", depth: 1, sortOrder: 4, parentId: topCategories[2].id } }),
  ]);

  // 신발 하위
  const subShoes = await Promise.all([
    prisma.category.create({ data: { name: "스니커즈", slug: "sneakers", depth: 1, sortOrder: 1, parentId: topCategories[4].id } }),
    prisma.category.create({ data: { name: "러닝화", slug: "running", depth: 1, sortOrder: 2, parentId: topCategories[4].id } }),
    prisma.category.create({ data: { name: "샌들/슬리퍼", slug: "sandals", depth: 1, sortOrder: 3, parentId: topCategories[4].id } }),
  ]);

  console.log(`  ✅ ${topCategories.length} top categories + sub-categories created`);

  // ═══════════════════════════════════════
  // 3. PRODUCTS (20개 데모 상품)
  // ═══════════════════════════════════════
  const productData = [
    {
      brandIdx: 0, categoryId: subTops[0].id,
      name: "레귤러 핏 크루넥 반팔 티셔츠", slug: "regular-fit-crewneck-tee",
      originalPrice: 29900, salePrice: 19900, isNew: true, isBest: true,
      rankPosition: 1, reviewCount: 12543, reviewAvg: 4.8,
      colors: ["블랙", "화이트", "그레이", "네이비"],
      sizes: ["S", "M", "L", "XL", "XXL"],
      tags: ["베이직", "반팔", "여름"],
    },
    {
      brandIdx: 1, categoryId: subTops[2].id,
      name: "오버핏 피그먼트 워싱 맨투맨", slug: "overfit-pigment-sweatshirt",
      originalPrice: 69000, salePrice: 48300, isNew: false, isBest: true,
      rankPosition: 2, reviewCount: 3421, reviewAvg: 4.6,
      colors: ["차콜", "베이지", "라이트그레이"],
      sizes: ["M", "L", "XL"],
      tags: ["맨투맨", "오버핏", "워싱"],
    },
    {
      brandIdx: 2, categoryId: subShoes[0].id,
      name: "에어맥스 97 블랙/화이트", slug: "air-max-97-black-white",
      originalPrice: 199000, salePrice: null, isNew: false, isBest: true,
      rankPosition: 3, reviewCount: 8932, reviewAvg: 4.7,
      colors: ["블랙/화이트"],
      sizes: ["250", "260", "270", "280", "290"],
      tags: ["에어맥스", "스니커즈", "나이키"],
    },
    {
      brandIdx: 3, categoryId: subPants[0].id,
      name: "와이드 데님 팬츠 라이트 블루", slug: "wide-denim-pants-light-blue",
      originalPrice: 89000, salePrice: 62300, isNew: true, isBest: false,
      rankPosition: 4, reviewCount: 5678, reviewAvg: 4.5,
      colors: ["라이트 블루", "미디엄 블루", "블랙"],
      sizes: ["S", "M", "L", "XL"],
      tags: ["데님", "와이드", "청바지"],
    },
    {
      brandIdx: 4, categoryId: topCategories[5].id,
      name: "나일론 메신저백 블랙", slug: "nylon-messenger-bag-black",
      originalPrice: 59000, salePrice: null, isNew: false, isBest: false,
      rankPosition: 5, reviewCount: 2341, reviewAvg: 4.4,
      colors: ["블랙", "올리브"],
      sizes: [],
      tags: ["메신저백", "가방", "나일론"],
    },
    {
      brandIdx: 5, categoryId: subTops[5].id,
      name: "캐시미어 블렌드 가디건", slug: "cashmere-blend-cardigan",
      originalPrice: 259000, salePrice: 181300, isNew: false, isBest: false,
      rankPosition: 6, reviewCount: 1234, reviewAvg: 4.9,
      colors: ["크림", "블랙", "카멜"],
      sizes: ["S", "M", "L"],
      tags: ["캐시미어", "가디건", "니트"],
    },
    {
      brandIdx: 0, categoryId: subTops[4].id,
      name: "릴렉스 핏 코튼 셔츠 화이트", slug: "relaxed-cotton-shirt-white",
      originalPrice: 39900, salePrice: 27930, isNew: false, isBest: false,
      rankPosition: 7, reviewCount: 4521, reviewAvg: 4.3,
      colors: ["화이트", "스카이블루", "베이지"],
      sizes: ["S", "M", "L", "XL"],
      tags: ["셔츠", "코튼", "베이직"],
    },
    {
      brandIdx: 6, categoryId: subShoes[0].id,
      name: "삼바 OG 화이트/블랙", slug: "samba-og-white-black",
      originalPrice: 139000, salePrice: null, isNew: true, isBest: true,
      rankPosition: 8, reviewCount: 6789, reviewAvg: 4.8,
      colors: ["화이트/블랙"],
      sizes: ["250", "260", "270", "280"],
      tags: ["삼바", "스니커즈", "아디다스"],
    },
    {
      brandIdx: 7, categoryId: subShoes[0].id,
      name: "530 그레이/실버", slug: "530-grey-silver",
      originalPrice: 129000, salePrice: 109000, isNew: false, isBest: false,
      rankPosition: null, reviewCount: 3456, reviewAvg: 4.5,
      colors: ["그레이/실버", "화이트/네이비"],
      sizes: ["250", "260", "270", "280", "290"],
      tags: ["뉴발란스", "530", "스니커즈"],
    },
    {
      brandIdx: 0, categoryId: subPants[1].id,
      name: "와이드 핏 치노 팬츠 베이지", slug: "wide-chino-pants-beige",
      originalPrice: 39900, salePrice: 31920, isNew: false, isBest: false,
      rankPosition: null, reviewCount: 7890, reviewAvg: 4.4,
      colors: ["베이지", "블랙", "카키"],
      sizes: ["S", "M", "L", "XL"],
      tags: ["치노", "와이드", "베이직"],
    },
    {
      brandIdx: 8, categoryId: subTops[0].id,
      name: "아치 로고 반팔 티셔츠", slug: "arch-logo-tee",
      originalPrice: 52000, salePrice: 36400, isNew: true, isBest: false,
      rankPosition: null, reviewCount: 2890, reviewAvg: 4.6,
      colors: ["블랙", "화이트"],
      sizes: ["S", "M", "L", "XL"],
      tags: ["로고", "반팔", "IAB"],
    },
    {
      brandIdx: 9, categoryId: subTops[0].id,
      name: "베이직 스투시 티 블랙", slug: "basic-stussy-tee-black",
      originalPrice: 69000, salePrice: null, isNew: false, isBest: false,
      rankPosition: null, reviewCount: 4567, reviewAvg: 4.7,
      colors: ["블랙", "화이트", "내추럴"],
      sizes: ["S", "M", "L", "XL"],
      tags: ["스투시", "로고", "베이직"],
    },
    {
      brandIdx: 10, categoryId: topCategories[7].id,
      name: "캉골 워시드 버킷햇", slug: "kangol-washed-bucket",
      originalPrice: 65000, salePrice: 45500, isNew: false, isBest: false,
      rankPosition: null, reviewCount: 1890, reviewAvg: 4.3,
      colors: ["블랙", "베이지", "네이비"],
      sizes: ["M", "L"],
      tags: ["버킷햇", "모자", "캉골"],
    },
    {
      brandIdx: 11, categoryId: subTops[2].id,
      name: "포켓 스웨트셔츠 블랙", slug: "pocket-sweatshirt-black",
      originalPrice: 169000, salePrice: null, isNew: true, isBest: false,
      rankPosition: null, reviewCount: 987, reviewAvg: 4.8,
      colors: ["블랙", "그레이"],
      sizes: ["S", "M", "L", "XL"],
      tags: ["칼하트", "맨투맨", "워크웨어"],
    },
    {
      brandIdx: 0, categoryId: subTops[3].id,
      name: "에센셜 풀오버 후드 그레이", slug: "essential-pullover-hoodie-grey",
      originalPrice: 49900, salePrice: 34930, isNew: false, isBest: true,
      rankPosition: null, reviewCount: 9876, reviewAvg: 4.6,
      colors: ["그레이", "블랙", "네이비", "크림"],
      sizes: ["S", "M", "L", "XL", "XXL"],
      tags: ["후드", "풀오버", "베이직"],
    },
    {
      brandIdx: 2, categoryId: subShoes[1].id,
      name: "에어줌 페가수스 41", slug: "air-zoom-pegasus-41",
      originalPrice: 149000, salePrice: 119000, isNew: true, isBest: false,
      rankPosition: null, reviewCount: 2345, reviewAvg: 4.5,
      colors: ["블랙/화이트", "볼트"],
      sizes: ["250", "260", "270", "280"],
      tags: ["러닝화", "페가수스", "나이키"],
    },
    {
      brandIdx: 3, categoryId: subPants[2].id,
      name: "나일론 쇼츠 블랙", slug: "nylon-shorts-black",
      originalPrice: 59000, salePrice: 41300, isNew: false, isBest: false,
      rankPosition: null, reviewCount: 3210, reviewAvg: 4.4,
      colors: ["블랙", "네이비", "베이지"],
      sizes: ["S", "M", "L", "XL"],
      tags: ["쇼츠", "나일론", "여름"],
    },
    {
      brandIdx: 1, categoryId: subTops[3].id,
      name: "C 로고 풀집 후드 네이비", slug: "c-logo-fullzip-hoodie-navy",
      originalPrice: 89000, salePrice: 62300, isNew: false, isBest: false,
      rankPosition: null, reviewCount: 1567, reviewAvg: 4.3,
      colors: ["네이비", "블랙", "그레이"],
      sizes: ["M", "L", "XL"],
      tags: ["후드", "풀집", "커버낫"],
    },
    {
      brandIdx: 6, categoryId: subPants[3].id,
      name: "에센셜 3S 트랙 팬츠", slug: "essential-3s-track-pants",
      originalPrice: 79000, salePrice: null, isNew: false, isBest: false,
      rankPosition: null, reviewCount: 5432, reviewAvg: 4.5,
      colors: ["블랙/화이트", "네이비/화이트"],
      sizes: ["S", "M", "L", "XL"],
      tags: ["트레이닝", "트랙팬츠", "아디다스"],
    },
    {
      brandIdx: 5, categoryId: topCategories[5].id,
      name: "미니 숄더백 블랙", slug: "mini-shoulder-bag-black",
      originalPrice: 189000, salePrice: 151200, isNew: true, isBest: false,
      rankPosition: null, reviewCount: 876, reviewAvg: 4.7,
      colors: ["블랙", "크림"],
      sizes: [],
      tags: ["숄더백", "미니백", "아더에러"],
    },
  ];

  const createdProducts = [];
  for (const p of productData) {
    const product = await prisma.product.create({
      data: {
        brandId: brands[p.brandIdx].id,
        categoryId: p.categoryId,
        name: p.name,
        slug: p.slug,
        originalPrice: p.originalPrice,
        salePrice: p.salePrice,
        status: ProductStatus.ACTIVE,
        isNew: p.isNew,
        isBest: p.isBest,
        rankPosition: p.rankPosition,
        reviewCount: p.reviewCount,
        reviewAvg: p.reviewAvg,
        viewCount: Math.floor(Math.random() * 50000) + 1000,
        sourceSite: "seed",
        images: {
          create: [
            { url: `https://placehold.co/600x750/c0c0c0/444?text=${encodeURIComponent(p.name.substring(0, 8))}`, alt: p.name, isMain: true, sortOrder: 0 },
            { url: `https://placehold.co/600x750/d0d0d0/555?text=Detail+1`, alt: `${p.name} 상세 1`, sortOrder: 1 },
            { url: `https://placehold.co/600x750/b0b0b0/333?text=Detail+2`, alt: `${p.name} 상세 2`, sortOrder: 2 },
          ],
        },
        tags: {
          create: p.tags.map((tag) => ({ tag })),
        },
        variants: {
          create: p.colors.flatMap((color) =>
            p.sizes.length > 0
              ? p.sizes.map((size) => ({ color, size, stock: Math.floor(Math.random() * 50) + 5 }))
              : [{ color, size: "ONE SIZE", stock: Math.floor(Math.random() * 30) + 10 }]
          ),
        },
      },
    });
    createdProducts.push(product);
  }

  console.log(`  ✅ ${createdProducts.length} products created with variants & images`);

  // ═══════════════════════════════════════
  // 4. BANNERS
  // ═══════════════════════════════════════
  await prisma.banner.createMany({
    data: [
      {
        title: "MEMBERS DAY",
        subtitle: "회원 한정 최대 70% OFF",
        imageUrl: "https://placehold.co/1200x400/1a1a1a/ffffff?text=MEMBERS+DAY+70%25+OFF",
        linkUrl: "/products?sale=true",
        position: "HOME_MAIN",
        sortOrder: 0,
      },
      {
        title: "2025 S/S 신상품",
        subtitle: "봄 여름 신상 최대 30% 할인",
        imageUrl: "https://placehold.co/1200x400/2d5a27/ffffff?text=2025+S/S+NEW+ARRIVALS",
        linkUrl: "/products?new=true",
        position: "HOME_MAIN",
        sortOrder: 1,
      },
      {
        title: "무신사 스탠다드",
        subtitle: "에센셜 컬렉션 단독 최저가",
        imageUrl: "https://placehold.co/1200x400/0a0a3c/ffffff?text=MUSINSA+STANDARD+ESSENTIAL",
        linkUrl: "/brands/musinsa-standard",
        position: "HOME_MAIN",
        sortOrder: 2,
      },
    ],
  });

  console.log("  ✅ 3 banners created");

  // ═══════════════════════════════════════
  // 5. MAGAZINES
  // ═══════════════════════════════════════
  await prisma.magazine.createMany({
    data: [
      {
        title: "2025 S/S 트렌드 키워드 5",
        slug: "2025-ss-trend-keywords",
        excerpt: "올 봄 여름 꼭 알아야 할 패션 트렌드를 정리했습니다.",
        content: "올 시즌의 핵심 키워드는 '미니멀 맥시멀리즘', '테크웨어 진화', '뉴트로 감성', '지속가능 패션', '젠더리스'입니다.",
        coverImage: "https://placehold.co/800x500/e8d5b7/333?text=S/S+TREND",
        author: "무신사 에디터",
        tags: ["트렌드", "S/S", "2025"],
        viewCount: 34521,
        isPublished: true,
        publishedAt: new Date("2025-03-15"),
      },
      {
        title: "스트리트 스냅: 성수동 패션 피플",
        slug: "street-snap-seongsu",
        excerpt: "성수동에서 만난 스타일리시한 사람들의 데일리 룩.",
        content: "성수동의 카페와 갤러리 사이에서 포착한 리얼 스트리트 스타일을 소개합니다.",
        coverImage: "https://placehold.co/800x500/c5c5c5/333?text=STREET+SNAP",
        author: "포토그래퍼 김진수",
        tags: ["스냅", "성수동", "스트리트"],
        viewCount: 12890,
        isPublished: true,
        publishedAt: new Date("2025-03-20"),
      },
      {
        title: "신발 입문 가이드: 첫 스니커즈 고르기",
        slug: "sneaker-beginner-guide",
        excerpt: "스니커즈 입문자를 위한 브랜드별 추천 모델.",
        content: "나이키 에어포스 1, 아디다스 삼바, 뉴발란스 574 등 입문자에게 추천하는 모델들을 비교 분석합니다.",
        coverImage: "https://placehold.co/800x500/b8b8d0/333?text=SNEAKER+GUIDE",
        author: "무신사 에디터",
        tags: ["스니커즈", "가이드", "입문"],
        viewCount: 28340,
        isPublished: true,
        publishedAt: new Date("2025-03-25"),
      },
      {
        title: "브랜드 히스토리: 디스이즈네버댓",
        slug: "brand-history-thisisneverthat",
        excerpt: "서울에서 세계로, 디스이즈네버댓의 10년.",
        content: "2010년 시작된 디스이즈네버댓의 브랜드 스토리와 시그니처 아이템들을 돌아봅니다.",
        coverImage: "https://placehold.co/800x500/a0a0a0/333?text=BRAND+HISTORY",
        author: "무신사 에디터",
        tags: ["브랜드", "히스토리", "디스이즈네버댓"],
        viewCount: 8976,
        isPublished: true,
        publishedAt: new Date("2025-04-01"),
      },
    ],
  });

  console.log("  ✅ 4 magazines created");

  // ═══════════════════════════════════════
  // 6. SNAPS
  // ═══════════════════════════════════════
  await prisma.snap.createMany({
    data: Array.from({ length: 12 }, (_, i) => ({
      imageUrl: `https://placehold.co/400x500/c0c0c0/444?text=SNAP+${i + 1}`,
      caption: [
        "오늘의 데일리 룩 🖤", "봄 코디 완성", "출근 OOTD", "주말 캐주얼",
        "데이트 코디", "카페 룩", "스트리트 무드", "미니멀 스타일링",
        "컬러 매치 포인트", "레이어드 룩", "슈즈 디테일", "액세서리 포인트"
      ][i],
      authorName: ["style_kim", "fashion_lee", "daily_park", "mood_choi", "look_jung", "snap_han",
        "street_oh", "minimal_song", "color_yoon", "layer_kang", "shoes_lim", "acc_moon"][i],
      authorImage: `https://placehold.co/50x50/909090/fff?text=${["K", "L", "P", "C", "J", "H", "O", "S", "Y", "K", "L", "M"][i]}`,
      likeCount: Math.floor(Math.random() * 500) + 50,
      commentCount: Math.floor(Math.random() * 50) + 5,
    })),
  });

  console.log("  ✅ 12 snaps created");

  // ═══════════════════════════════════════
  // 7. RELEASES
  // ═══════════════════════════════════════
  await prisma.release.createMany({
    data: [
      {
        productName: "Nike Dunk Low 'Panda' 2025",
        brandName: "Nike",
        imageUrl: "https://placehold.co/400x400/c0c0c0/333?text=DUNK+LOW",
        releaseDate: new Date("2025-04-10"),
        price: 139000,
        status: ReleaseStatus.UPCOMING,
        notifyCount: 4523,
      },
      {
        productName: "adidas Samba OG 'Cream'",
        brandName: "adidas",
        imageUrl: "https://placehold.co/400x400/d0d0c0/333?text=SAMBA+CREAM",
        releaseDate: new Date("2025-04-15"),
        price: 139000,
        status: ReleaseStatus.UPCOMING,
        notifyCount: 3210,
      },
      {
        productName: "New Balance 2002R 'Sea Salt'",
        brandName: "New Balance",
        imageUrl: "https://placehold.co/400x400/c0c5c0/333?text=2002R",
        releaseDate: new Date("2025-04-20"),
        price: 169000,
        status: ReleaseStatus.UPCOMING,
        notifyCount: 2890,
      },
      {
        productName: "thisisneverthat x GORE-TEX Jacket",
        brandName: "thisisneverthat",
        imageUrl: "https://placehold.co/400x400/b0b0b0/333?text=GORE-TEX",
        releaseDate: new Date("2025-03-28"),
        price: 389000,
        status: ReleaseStatus.RELEASED,
        notifyCount: 1567,
      },
    ],
  });

  console.log("  ✅ 4 releases created");

  // ═══════════════════════════════════════
  // 8. CRAWL JOB (데모 크롤링 기록)
  // ═══════════════════════════════════════
  await prisma.crawlJob.createMany({
    data: [
      {
        sourceSite: "musinsa",
        targetUrl: "https://www.musinsa.com/ranking/best",
        status: CrawlStatus.COMPLETED,
        totalItems: 50,
        successItems: 48,
        failedItems: 2,
        startedAt: new Date("2025-04-01T10:00:00"),
        completedAt: new Date("2025-04-01T10:05:30"),
      },
      {
        sourceSite: "29cm",
        targetUrl: "https://shop.29cm.co.kr/best",
        status: CrawlStatus.COMPLETED,
        totalItems: 30,
        successItems: 30,
        failedItems: 0,
        startedAt: new Date("2025-04-01T11:00:00"),
        completedAt: new Date("2025-04-01T11:03:15"),
      },
      {
        sourceSite: "musinsa",
        targetUrl: "https://www.musinsa.com/new",
        status: CrawlStatus.PENDING,
        totalItems: 0,
        successItems: 0,
        failedItems: 0,
      },
    ],
  });

  console.log("  ✅ 3 crawl jobs created");

  // ═══════════════════════════════════════
  // 9. COUPONS
  // ═══════════════════════════════════════
  await prisma.coupon.createMany({
    data: [
      {
        code: "WELCOME10",
        name: "신규 회원 10% 할인",
        description: "첫 구매 시 10% 할인 쿠폰",
        discountType: "PERCENTAGE",
        discountValue: 10,
        minOrderAmount: 30000,
        maxDiscount: 10000,
        totalQuantity: 10000,
        startsAt: new Date("2025-01-01"),
        expiresAt: new Date("2025-12-31"),
      },
      {
        code: "MEMBERS70",
        name: "멤버스데이 최대 70% 할인",
        description: "멤버스데이 기간 한정 쿠폰",
        discountType: "PERCENTAGE",
        discountValue: 15,
        minOrderAmount: 50000,
        maxDiscount: 30000,
        totalQuantity: 5000,
        startsAt: new Date("2025-04-01"),
        expiresAt: new Date("2025-04-07"),
      },
      {
        code: "FREE3000",
        name: "3,000원 할인 쿠폰",
        description: "전 상품 3,000원 할인",
        discountType: "FIXED_AMOUNT",
        discountValue: 3000,
        minOrderAmount: 20000,
        startsAt: new Date("2025-01-01"),
        expiresAt: new Date("2025-12-31"),
      },
    ],
  });

  console.log("  ✅ 3 coupons created");

  // ═══════════════════════════════════════
  // 10. TEST USERS
  // ═══════════════════════════════════════
  const testPassword = await bcrypt.hash("test1234", 12);

  await prisma.user.createMany({
    data: [
      {
        email: "user@test.com",
        name: "테스트 유저",
        nickname: "fashionista",
        passwordHash: testPassword,
        role: "CUSTOMER",
      },
      {
        email: "admin@test.com",
        name: "관리자",
        nickname: "admin",
        passwordHash: testPassword,
        role: "ADMIN",
      },
    ],
  });

  console.log("  ✅ 2 test users created (user@test.com / admin@test.com, pw: test1234)");

  // ═══════════════════════════════════════
  // DONE
  // ═══════════════════════════════════════
  const counts = {
    brands: await prisma.brand.count(),
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    variants: await prisma.productVariant.count(),
    images: await prisma.productImage.count(),
    banners: await prisma.banner.count(),
    magazines: await prisma.magazine.count(),
    snaps: await prisma.snap.count(),
    releases: await prisma.release.count(),
    crawlJobs: await prisma.crawlJob.count(),
    coupons: await prisma.coupon.count(),
  };

  console.log("\n🎉 Seeding complete!");
  console.log(counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
