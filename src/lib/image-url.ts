/**
 * 외부 CDN 이미지 URL을 썸네일용 작은 사이즈로 변환.
 * 지원: Shopify, Shopify-호환 (markandlona-korea.co.kr/cdn/shop), PXG.
 * 미지원 CDN은 원본 그대로 반환.
 */
export function thumbUrl(url: string | null | undefined, width = 400): string {
  if (!url) return "";

  // Shopify CDN — _2000x, _1024x1024, _800x800 등을 _400x로 치환
  if (
    url.includes("/cdn/shop/") ||
    url.includes("cdn.shopify.com") ||
    url.includes("shopifycdn") ||
    url.includes("shopifycdn.net")
  ) {
    // _NUMxNUM 또는 _NUMx 패턴
    const sized = url.replace(/_(\d+x\d+|\d+x)\.(jpg|jpeg|png|webp)/i, `_${width}x.$2`);
    if (sized !== url) return sized;
    // 사이즈 파라미터 없으면 추가
    return url.replace(/\.(jpg|jpeg|png|webp)(\?|$)/i, `_${width}x.$1$2`);
  }

  // Cafe24 — 이미지 URL 끝에 ?width 같은 파라미터 가능 (서버에 따라)
  // 안전하게 통과
  return url;
}
