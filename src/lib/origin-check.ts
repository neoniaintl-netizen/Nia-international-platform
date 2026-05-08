/**
 * Origin/Referer 검사 — 동일 출처에서 온 state-changing 요청만 허용.
 *
 * NextAuth가 자체 CSRF 보호를 하지만, 그건 NextAuth 라우트 한정.
 * 결제·주문·환불 같은 비-NextAuth API는 별도로 Origin을 검증해야 안전.
 *
 * 통과 조건 (둘 중 하나):
 * - Origin 헤더가 허용된 도메인 중 하나
 * - Referer 헤더가 허용된 도메인 중 하나 (Origin이 없는 일부 클라이언트 대응)
 *
 * Webhook 예외: PortOne webhook은 외부에서 들어오므로 이 검사 적용 X (웹훅은 HMAC 서명으로 별도 검증).
 */

function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  if (process.env.AUTH_URL) origins.push(process.env.AUTH_URL);
  if (process.env.NEXTAUTH_URL) origins.push(process.env.NEXTAUTH_URL);
  if (process.env.NEXT_PUBLIC_SITE_URL) origins.push(process.env.NEXT_PUBLIC_SITE_URL);

  // Railway 도메인 항상 포함 (env 미설정 폴백)
  origins.push("https://nkbus-production.up.railway.app");

  // 개발 환경
  if (process.env.NODE_ENV !== "production") {
    origins.push("http://localhost:3000", "http://localhost:3001", "http://localhost:3002");
  }

  // 프로토콜+호스트만 비교하기 위해 trailing slash 제거
  return Array.from(new Set(origins.map((o) => o.replace(/\/+$/, ""))));
}

function originOf(urlStr: string | null): string | null {
  if (!urlStr) return null;
  try {
    const u = new URL(urlStr);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

/**
 * 요청이 동일 출처인지 검사.
 * @returns true면 통과, false면 차단
 */
export function isSameOrigin(req: Request): boolean {
  const allowed = getAllowedOrigins().map((o) => originOf(o)).filter((x): x is string => !!x);

  const originHeader = req.headers.get("origin");
  if (originHeader) {
    return allowed.includes(originHeader);
  }

  const refererHeader = req.headers.get("referer");
  const refererOrigin = originOf(refererHeader);
  if (refererOrigin) {
    return allowed.includes(refererOrigin);
  }

  // Origin/Referer 둘 다 없으면 차단 (정상 브라우저는 항상 보냄)
  return false;
}
