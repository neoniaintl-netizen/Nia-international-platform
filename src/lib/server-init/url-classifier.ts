/**
 * 이미지 URL → product type 키워드 매칭 + UNRELATED(절대 product 아님) 판정.
 *
 * cleanup-mismatch가 product의 type을 결정한 뒤 그 type의 화이트리스트와
 * URL을 매칭해 mismatch 검출.
 */

import type { ProductType } from "./product-type";

/**
 * type별 허용 URL 키워드. 매칭 0개 = mismatch (공격적 모드).
 */
export const URL_WHITELIST: Record<Exclude<ProductType, "UNKNOWN">, RegExp> = {
  APPAREL_TOP:
    /(shirt|blouse|tee|t-?shirt|polo|hood(ie)?|knit|sweater|sweatshirt|crop|cardigan|tank|cami|jersey|baselayer|sleeve|top(?!_)|p\d{4}|nv\d{4}|w\d{4}r|s262\d|wbw\d|me\d{2}atp|ls\d|primary|featured)/i,
  APPAREL_BOTTOM:
    /(pant|trouser|jean|denim|chino|cargo|short(?!s?[-_]?sleeve)|jogger|sweatpant|legging|tights|skirt|kilt|bottom|capri|airlift|airbrush|w5434|w5473|w5630|w5475|primary|featured)/i,
  APPAREL_OUTER:
    /(jacket|coat|parka|windbreaker|anorak|gilet|vest|fleece|down|puffer|outer|nv5vs03|w262001n|primary|featured)/i,
  APPAREL_DRESS:
    /(dress|gown|robe|romper|jumpsuit|coverall|onepiece|primary|featured)/i,
  UNDERWEAR:
    /(bra|seamless|underwear|baselayer|panty|brief|boxer|primary|featured)/i,
  SHOES:
    /(shoes|sneaker|footwear|running|trail-?running|gtx[-_ ]?\d|jordan|kobe|airmax|airforce|dunk|pegasus|metcon|cortez|huarache|kiltie|derby|loafer|stride|s262001hs[lt]|primary|featured)/i,
  GOLF_SHOES:
    /(golf-?shoes|spike|cleat|kiltie|stride|derby|primary|featured)/i,
  GOLF_APPAREL:
    /(golf|tour|fairway-?wear|caddy-?wear|me\d{2}atp|hole-in-one|crisscross|signature-polo|comfort-fit|athletic-fit|polo|sleeve|shirt|jacket|pant|primary|featured)/i,
  GOLF_EQUIPMENT:
    /(driver|wedge|putter|iron|hybrid|fairway|headcover|club|shaft|grip|0311|0341|black-?ops|sugar-?daddy|drone|spitfire|gen-?\d|primary|featured)/i,
  GOLF_BAG:
    /(caddybag|caddy-?bag|cart-?bag|stand-?bag|tour-?bag|golfbag|primary|featured)/i,
  HEADWEAR:
    /(cap|visor|beanie|bucket|fedora|hat|snapback|trucker|headwear|panama|primary|featured)/i,
  BAG:
    /(backpack|tote|sling|crossbody|duffle|messenger|handbag|shoulder-?bag|bag(?!-?of)|primary|featured)/i,
  ACCESSORY:
    /(sock|belt|glove|watch|necklace|earring|bracelet|ring|wallet|scarf|muffler|marker|tee-?marker|ball-?marker|primary|featured)/i,
  BEAUTY:
    /(perfume|fragrance|lipstick|skincare|cosmetic|toner|serum|cream|cushion|primary|featured)/i,
};

/**
 * type 별 forbidden URL 키워드 (다른 type의 강한 표시자가 박혀있으면 mismatch).
 */
export const URL_FORBIDDEN_BY_TYPE: Record<
  Exclude<ProductType, "UNKNOWN">,
  RegExp
> = {
  APPAREL_TOP:
    /(driver|wedge|putter|iron|hybrid|fairway|headcover|club-?head|shaft|grip|sneaker|jordan|kobe|airmax|caddybag|cart-?bag|backpack|cap\b|visor|snapback|bucket-?hat|beanie)/i,
  APPAREL_BOTTOM:
    /(driver|wedge|putter|iron|hybrid|fairway|headcover|sneaker|jordan|kobe|airmax|caddybag|cart-?bag|cap\b|visor|snapback|beanie)/i,
  APPAREL_OUTER:
    /(driver|wedge|putter|iron|fairway|headcover|sneaker|jordan|kobe|airmax|caddybag|cart-?bag|cap\b|visor|snapback|beanie)/i,
  APPAREL_DRESS:
    /(driver|wedge|putter|iron|sneaker|caddybag|cart-?bag|cap\b)/i,
  UNDERWEAR: /(driver|wedge|putter|sneaker|caddybag|cap\b)/i,
  SHOES:
    /(driver|wedge|putter|iron|hybrid|fairway|headcover|club-?head|shaft|grip|polo|shirt|hoodie|legging|jacket|coat|cap\b|visor|caddybag|cart-?bag|backpack)/i,
  GOLF_SHOES:
    /(driver|wedge|putter|iron|hybrid|fairway|headcover|club-?head|polo|shirt|hoodie|legging|cap\b|visor)/i,
  GOLF_APPAREL:
    /(driver|wedge|putter|iron|hybrid|fairway|headcover|club-?head|sneaker|jordan|cap\b|visor|caddybag|cart-?bag)/i,
  GOLF_EQUIPMENT:
    /(polo|shirt|blouse|tee\b|hoodie|legging|jacket|coat|sneaker|jordan|kobe|cap\b|visor|caddybag|cart-?bag|backpack)/i,
  GOLF_BAG:
    /(polo|shirt|hoodie|jacket|driver|wedge|putter|iron|sneaker|cap\b|visor)/i,
  HEADWEAR:
    /(polo|shirt|hoodie|legging|jacket|driver|wedge|putter|iron|sneaker|jordan|caddybag|cart-?bag|backpack)/i,
  BAG:
    /(polo|shirt|hoodie|legging|driver|wedge|putter|sneaker|cap\b|visor)/i,
  ACCESSORY:
    /(driver|wedge|putter|iron|hybrid|fairway|sneaker|caddybag|cart-?bag)/i,
  BEAUTY:
    /(driver|wedge|putter|iron|sneaker|polo|shirt|jacket|caddybag)/i,
};

/**
 * UNRELATED — product 이미지가 절대 아닌 패턴 (모든 type 공통 mismatch).
 */
export const UNRELATED_RE: RegExp[] = [
  /(_HERO_?|HERO[-_]|storycard|story-?card|main-?banner|brand-?banner|hero-?banner|carousel|promotion|campaign|featured\.jpg|gnb_banner|GNB[-_]|BIS_alt)/i, // marketing
  /(history|who-?we-?are|about-?us|naked-?yoga-?book|mindful-?movement|brand-?story|editorial)/i, // editorial
  /(size-?(chart|table|guide)|measurement|fit-?guide|sizing|how-?to-?measure)/i, // size table
  /(flag|국기|korea-?flag|kr-?flag|country-?icon|nation-?icon)/i, // 국기
  /(text-?page|description-?page|info-?page|notice|policy|terms|guide-?text|spec-?sheet|datasheet|manual)/i, // 텍스트/문서
  /(\.pdf|\.doc|\.txt)$/i, // 문서 확장자
  /(icon-|ico_|sprite|logo[-_]?(small|footer|nav)|svg-?icon)/i, // 아이콘/로고
  /(coming-?soon|placeholder-?(soon|tbd))/i, // 자체 placeholder
];

/**
 * 이미지 URL이 placeholder인지 검사.
 */
export function isPlaceholderUrl(url: string): boolean {
  return /placehold\.co|placeholder/i.test(url);
}

/**
 * 이미지 URL이 product type에 맞는지 판정.
 *
 * 반환:
 * - "ok"            허용
 * - "placeholder"   placehold.co (의도된 placeholder, keep)
 * - "unrelated"     marketing/flag/text 등 (mismatch)
 * - "forbidden"     다른 type의 강한 표시자 (mismatch)
 * - "no-keyword"    화이트리스트 키워드 0개 (공격적: mismatch)
 */
export type Verdict = "ok" | "placeholder" | "unrelated" | "forbidden" | "no-keyword";

export function classifyImageUrl(url: string, type: ProductType): Verdict {
  if (isPlaceholderUrl(url)) return "placeholder";
  if (UNRELATED_RE.some((re) => re.test(url))) return "unrelated";

  if (type === "UNKNOWN") return "ok"; // UNKNOWN type은 보수적으로 허용 (UNRELATED만 잡음)

  if (URL_FORBIDDEN_BY_TYPE[type].test(url)) return "forbidden";
  if (!URL_WHITELIST[type].test(url)) return "no-keyword";
  return "ok";
}
