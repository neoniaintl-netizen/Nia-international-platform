/**
 * Product 카테고리 type 분류기.
 *
 * cleanup-mismatch가 product의 image URL이 그 type의 화이트리스트와 매칭되는지
 * 검사할 때 사용. UNKNOWN으로 판정되면 보수적으로 검사 skip.
 */

export type ProductType =
  | "APPAREL_TOP" // 셔츠/티/후디/니트/sweater/blouse/polo/sleeve
  | "APPAREL_BOTTOM" // 팬츠/스커트/반바지/legging/jogger/jean
  | "APPAREL_OUTER" // 자켓/코트/parka/anorak/down/fleece
  | "APPAREL_DRESS" // 원피스/dress/jumpsuit
  | "UNDERWEAR" // bra/seamless/baselayer
  | "SHOES" // 스니커즈/sneaker/derby/kiltie
  | "GOLF_SHOES" // 골프 슈즈
  | "GOLF_APPAREL" // 골프 카테고리 + 의류
  | "GOLF_EQUIPMENT" // driver/wedge/iron/putter/club
  | "GOLF_BAG" // caddybag/cartbag
  | "HEADWEAR" // 모자/cap/visor/snapback
  | "BAG" // 가방/backpack/tote
  | "ACCESSORY" // 양말/벨트/glove/marker
  | "BEAUTY" // 향수/스킨/lipstick
  | "UNKNOWN";

const NAME_MATCHERS: Array<{ type: ProductType; re: RegExp }> = [
  // 신발류 — 골프 슈즈 우선
  {
    type: "GOLF_SHOES",
    re: /(골프슈즈|골프화|golf[-_ ]?shoes|spike|cleat)/i,
  },
  {
    type: "SHOES",
    re: /(슈즈|운동화|스니커즈|러닝화|부츠|샌들|로퍼|shoes|sneaker|derby|kiltie|loafer|boot|sandal|footwear|trainer)/i,
  },
  // 모자
  {
    type: "HEADWEAR",
    re: /(모자|캡|비니|버킷햇|cap|visor|beanie|bucket[-_ ]?hat|snapback|trucker[-_ ]?hat|fedora|panama|headwear|hat\b)/i,
  },
  // 가방 (caddybag보다 일반 가방 먼저)
  {
    type: "GOLF_BAG",
    re: /(캐디백|카트백|caddy[-_ ]?bag|cart[-_ ]?bag|stand[-_ ]?bag|tour[-_ ]?bag|golfbag)/i,
  },
  {
    type: "BAG",
    re: /(가방|백팩|토트|크로스백|backpack|tote|sling|crossbody|duffle|messenger|handbag|shoulder[-_ ]?bag)/i,
  },
  // 골프 장비
  {
    type: "GOLF_EQUIPMENT",
    re: /(드라이버|아이언|웨지|퍼터|하이브리드|페어웨이|driver|wedge|putter|iron|hybrid|fairway|headcover|club|shaft|grip)/i,
  },
  // 의류 dress류 (legging/skirt 보다 먼저)
  {
    type: "APPAREL_DRESS",
    re: /(원피스|드레스|점프수트|롬퍼|dress|jumpsuit|romper|coverall|robe)/i,
  },
  {
    type: "UNDERWEAR",
    re: /(브라|언더웨어|bra|seamless|baselayer|underwear|panty|brief|boxer)/i,
  },
  // 의류 bottom
  {
    type: "APPAREL_BOTTOM",
    re: /(팬츠|바지|반바지|레깅스|스커트|치마|조거|pant|trouser|jean|denim|chino|cargo|short|jogger|sweatpant|legging|tights|skirt|kilt|bottom)/i,
  },
  // 의류 outer
  {
    type: "APPAREL_OUTER",
    re: /(자켓|재킷|점퍼|코트|패딩|아노락|플리스|jacket|coat|parka|windbreaker|anorak|gilet|vest|fleece|down|puffer|outer)/i,
  },
  // 의류 top
  {
    type: "APPAREL_TOP",
    re: /(셔츠|블라우스|티셔츠|티|폴로|후드|후디|니트|스웨터|맨투맨|크롭|롱슬리브|반팔|긴팔|sleeve|shirt|blouse|tee|t\-?shirt|polo|hood(ie)?|knit|sweater|sweatshirt|crop|cardigan|tank|cami|jersey|baselayer|top)/i,
  },
  // 액세서리
  {
    type: "ACCESSORY",
    re: /(양말|벨트|장갑|시계|목걸이|반지|sock|belt|glove|watch|necklace|earring|bracelet|ring|wallet|scarf|muffler|marker)/i,
  },
  // 뷰티
  {
    type: "BEAUTY",
    re: /(향수|립|쿠션|스킨|토너|크림|perfume|fragrance|lipstick|skincare|cosmetic|toner|serum|cream|cushion)/i,
  },
];

/**
 * Product를 카테고리 type으로 분류.
 *
 * 우선순위:
 * 1. categorySlug가 `golf*` 이고 NAME 매칭이 의류/신발이면 GOLF_* 로 강제
 * 2. NAME 매칭 (위 NAME_MATCHERS 순서대로)
 * 3. UNKNOWN
 */
export function classifyProductType(
  name: string,
  brandSlug: string | null,
  categorySlug: string | null
): ProductType {
  const matched = NAME_MATCHERS.find((m) => m.re.test(name));
  const baseType: ProductType = matched ? matched.type : "UNKNOWN";

  // 골프 카테고리 강제: category.slug가 golf*면
  // - APPAREL_* → GOLF_APPAREL
  // - SHOES → GOLF_SHOES
  // - BAG → GOLF_BAG
  if (categorySlug && /^golf/i.test(categorySlug)) {
    if (
      baseType === "APPAREL_TOP" ||
      baseType === "APPAREL_BOTTOM" ||
      baseType === "APPAREL_OUTER" ||
      baseType === "APPAREL_DRESS"
    ) {
      return "GOLF_APPAREL";
    }
    if (baseType === "SHOES") return "GOLF_SHOES";
    if (baseType === "BAG") return "GOLF_BAG";
  }

  // brand slug 기반 fallback (UNKNOWN일 때만)
  if (baseType === "UNKNOWN" && brandSlug) {
    // Salomon, Wilson, Nike-skims 등 브랜드 단위 추정은 부정확하므로 UNKNOWN 유지
  }

  return baseType;
}

/**
 * 한 type이 forbidden으로 간주할 다른 type들의 키워드 합집합을 반환.
 * (의미: APPAREL_TOP product 이미지에 SHOES/BAG/HEADWEAR/GOLF_EQUIPMENT 키워드가 있으면 mismatch)
 */
export const TYPE_CONFLICTS: Record<ProductType, ProductType[]> = {
  APPAREL_TOP: ["SHOES", "GOLF_SHOES", "GOLF_EQUIPMENT", "GOLF_BAG", "BAG", "HEADWEAR"],
  APPAREL_BOTTOM: ["SHOES", "GOLF_SHOES", "GOLF_EQUIPMENT", "GOLF_BAG", "BAG", "HEADWEAR"],
  APPAREL_OUTER: ["SHOES", "GOLF_SHOES", "GOLF_EQUIPMENT", "GOLF_BAG", "BAG", "HEADWEAR"],
  APPAREL_DRESS: ["SHOES", "GOLF_SHOES", "GOLF_EQUIPMENT", "GOLF_BAG", "BAG", "HEADWEAR"],
  UNDERWEAR: ["SHOES", "GOLF_SHOES", "GOLF_EQUIPMENT", "GOLF_BAG", "BAG", "HEADWEAR"],
  SHOES: ["APPAREL_TOP", "APPAREL_BOTTOM", "APPAREL_OUTER", "APPAREL_DRESS", "GOLF_EQUIPMENT", "GOLF_BAG", "BAG", "HEADWEAR"],
  GOLF_SHOES: ["APPAREL_TOP", "APPAREL_BOTTOM", "APPAREL_OUTER", "APPAREL_DRESS", "GOLF_EQUIPMENT", "GOLF_BAG", "BAG", "HEADWEAR"],
  GOLF_APPAREL: ["SHOES", "GOLF_SHOES", "GOLF_EQUIPMENT", "GOLF_BAG", "BAG", "HEADWEAR"],
  GOLF_EQUIPMENT: ["APPAREL_TOP", "APPAREL_BOTTOM", "APPAREL_OUTER", "APPAREL_DRESS", "SHOES", "HEADWEAR", "BAG"],
  GOLF_BAG: ["APPAREL_TOP", "APPAREL_BOTTOM", "APPAREL_OUTER", "APPAREL_DRESS", "SHOES", "GOLF_EQUIPMENT"],
  HEADWEAR: ["APPAREL_TOP", "APPAREL_BOTTOM", "APPAREL_OUTER", "APPAREL_DRESS", "SHOES", "GOLF_EQUIPMENT", "GOLF_BAG", "BAG"],
  BAG: ["APPAREL_TOP", "APPAREL_BOTTOM", "APPAREL_OUTER", "APPAREL_DRESS", "SHOES", "GOLF_EQUIPMENT", "HEADWEAR"],
  ACCESSORY: ["SHOES", "GOLF_SHOES", "GOLF_EQUIPMENT", "GOLF_BAG"],
  BEAUTY: ["APPAREL_TOP", "APPAREL_BOTTOM", "APPAREL_OUTER", "SHOES", "GOLF_SHOES", "GOLF_EQUIPMENT"],
  UNKNOWN: [],
};
