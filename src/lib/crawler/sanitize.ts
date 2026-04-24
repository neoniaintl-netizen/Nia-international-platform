import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p", "div", "span", "br", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u",
  "ul", "ol", "li",
  "table", "thead", "tbody", "tr", "td", "th", "caption",
  "img", "picture", "source",
  "a",
  "figure", "figcaption",
  "small", "sub", "sup",
];

const ALLOWED_ATTR = [
  "src", "srcset", "sizes",
  "alt", "title",
  "href", "target", "rel",
  "width", "height",
  "style", "class",
];

const STRIP_STYLE_PROPS = /(?:position|z-index|visibility)\s*:[^;]+;?/gi;

/**
 * 크롤링된 상품 상세 HTML을 안전하게 정제.
 * - <script>, <iframe>, <form>, event handler 제거
 * - 위치/숨김 계열 CSS 제거 (레이아웃 깨짐 방지)
 * - width/height 100% 유지, max-width 제한은 렌더링 쪽에서 처리
 */
export function sanitizeProductHtml(html: string): string {
  if (!html) return "";

  const cleaned = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(https?:)?\/\//,
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "button"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  });

  return cleaned.replace(/style="([^"]*)"/g, (_, s) => {
    const safe = s.replace(STRIP_STYLE_PROPS, "").trim();
    return safe ? `style="${safe}"` : "";
  });
}
