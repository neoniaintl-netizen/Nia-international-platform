/**
 * 봇/스크래퍼 탐지 유틸리티.
 *
 * 정책:
 * - 알려진 정상 검색엔진 봇(Google, Bing, Naver, Daum, 소셜 미리보기) → 통과
 * - 알려진 스크래퍼/도구 UA → 차단
 * - 빈/짧은/의심스러운 UA → 차단
 * - 일반 브라우저 UA → 통과
 *
 * 우회 가능성: UA는 자유롭게 변조 가능하므로 100% 차단은 불가능.
 * rate limit + behavioral 신호와 조합해서 사용.
 */

/** 통과시킬 정상 봇 (검색엔진/소셜 미리보기) */
const ALLOWED_BOTS_RE =
  /(googlebot|adsbot-google|google-inspectiontool|bingbot|slurp|duckduckbot|baiduspider|yandexbot|naverbot|yeti|daumoa|daum\/|kakao\b|twitterbot|facebookexternalhit|facebookcatalog|linkedinbot|whatsapp|telegrambot|skypeuripreview|applebot|discordbot|pinterestbot|line\/)/i;

/** 차단할 스크래퍼/자동화 도구 UA 패턴 */
const BLOCKED_UA_RE =
  /(python-requests|python-urllib|aiohttp|httpx|scrapy|httrack|crawler|spider|bot[\s/]|harvest|extractor|wget|curl\/|libwww-perl|java\/|apache-httpclient|go-http-client|node-fetch|axios\/|got\/|nutch|phantomjs|headlesschrome|puppeteer|playwright|cypress|selenium|webdriver|wpscan|nikto|sqlmap|nmap|masscan|zgrab)/i;

/**
 * 봇 판정 결과.
 * - "allow": 통과 (정상 봇 또는 일반 브라우저)
 * - "block": 차단 (스크래퍼/자동화 도구)
 * - "suspicious": 의심 (UA 비어있거나 매우 짧음 — 추가 검증 권장)
 */
export type BotVerdict = "allow" | "block" | "suspicious";

export function classifyUserAgent(ua: string | null | undefined): BotVerdict {
  if (!ua || ua.trim().length === 0) return "suspicious";
  const trimmed = ua.trim();

  // UA가 너무 짧으면 의심
  if (trimmed.length < 10) return "suspicious";

  // 정상 봇 화이트리스트 우선 — 검색엔진은 무조건 허용
  if (ALLOWED_BOTS_RE.test(trimmed)) return "allow";

  // 알려진 스크래퍼/자동화 도구 차단
  if (BLOCKED_UA_RE.test(trimmed)) return "block";

  // 일반 브라우저 UA는 보통 "Mozilla/5.0 ..."으로 시작
  // Mozilla 표기 없는 UA는 봇일 가능성 높음
  if (!/mozilla\//i.test(trimmed)) return "suspicious";

  return "allow";
}
