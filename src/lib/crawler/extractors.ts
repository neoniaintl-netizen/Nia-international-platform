/**
 * Cafe24/일반 상품 HTML에서 소재 / 제조국 / 세탁 / 핏 같은 메타 정보를 추출.
 *
 * 한국 쇼핑몰은 보통 다음 패턴 중 하나로 표기:
 *   - "소재 : 면 100%" / "재질 : ..." / "원단 : ..."
 *   - "제조국 : 대한민국" / "원산지 : ..."
 *   - "세탁법 : 30도 이하 ..." / "세탁 : ..."
 *   - "핏 : 슬림 핏" / "Fit : ..."
 *
 * 결과는 plain text. description HTML 에 메타 섹션으로 prepend 됨.
 */
export function extractMetaFromHtml(html: string): {
  material?: string;
  origin?: string;
  careGuide?: string;
  fit?: string;
} {
  if (!html) return {};

  // HTML 태그 제거 + 공백 정규화 (검색용 plain text)
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    material: pick(text, [
      /소재\s*[:：]\s*([^\n.•·|]+?)(?=\s{2,}|제조국|원산지|세탁|핏|color|color|color|$)/i,
      /재질\s*[:：]\s*([^\n.•·|]+?)(?=\s{2,}|제조국|원산지|세탁|핏|$)/i,
      /원단\s*[:：]\s*([^\n.•·|]+?)(?=\s{2,}|제조국|원산지|세탁|핏|$)/i,
      /material\s*[:：]\s*([^\n.•·|]+?)(?=\s{2,}|origin|made|wash|fit|$)/i,
    ]),
    origin: pick(text, [
      /제조국\s*[:：]\s*([^\n.•·|]+?)(?=\s{2,}|소재|재질|세탁|핏|$)/i,
      /원산지\s*[:：]\s*([^\n.•·|]+?)(?=\s{2,}|소재|재질|세탁|핏|$)/i,
      /made in\s*[:：]?\s*([A-Za-z가-힣]+)/i,
    ]),
    careGuide: pick(text, [
      /세탁법\s*[:：]\s*([^\n.•·|]+?)(?=\s{2,}|소재|재질|제조국|핏|$)/i,
      /세탁\s*[:：]\s*([^\n.•·|]+?)(?=\s{2,}|소재|재질|제조국|핏|$)/i,
      /care\s*[:：]\s*([^\n.•·|]+?)(?=\s{2,}|material|origin|fit|$)/i,
    ]),
    fit: pick(text, [
      /핏\s*[:：]\s*([^\n.•·|]+?)(?=\s{2,}|소재|재질|제조국|세탁|$)/i,
      /fit\s*[:：]\s*([^\n.•·|]+?)(?=\s{2,}|material|origin|care|$)/i,
    ]),
  };
}

/** 여러 정규식 중 첫 매치를 반환. 200자 초과는 잘라냄. */
function pick(text: string, patterns: RegExp[]): string | undefined {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const value = m[1].trim().replace(/\s+/g, " ").slice(0, 200);
      if (value.length >= 2) return value;
    }
  }
  return undefined;
}

/** Cafe24 상품 URL 에서 product_no 추출 → externalProductId 로 사용 */
export function extractCafe24ProductNo(url: string): string | undefined {
  // ?product_no=1234 또는 /product/.../1234/...
  const queryMatch = url.match(/[?&]product_no=(\d+)/);
  if (queryMatch) return queryMatch[1];

  const pathMatch = url.match(/\/product\/[^\/]+\/(\d+)\//);
  if (pathMatch) return pathMatch[1];

  return undefined;
}

/** 성별 추론 — URL/카테고리/이름에서 추출 */
export function inferGender(
  hints: { url?: string; categoryName?: string; productName?: string }
): "MEN" | "WOMEN" | "UNISEX" | "UNKNOWN" {
  const haystack = [hints.url, hints.categoryName, hints.productName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/\bwomen|female|여성|우먼|레이디|w\d/i.test(haystack)) return "WOMEN";
  if (/\bmen|male|남성|맨즈|men\d/i.test(haystack)) return "MEN";
  if (/\bunisex|공용|유니섹스/i.test(haystack)) return "UNISEX";
  return "UNKNOWN";
}
