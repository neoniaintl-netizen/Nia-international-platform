/**
 * 개발자도구 console에 보안 경고 메시지 출력.
 *
 * - 일반 사용자가 실수로 개발자도구 열었을 때 위협 인지
 * - "친구가 시키는 대로 코드 붙여넣기" 식 self-XSS 사회공학 공격 차단 시도
 * - 페이스북/카카오/쿠팡 등 대형 사이트가 모두 사용하는 패턴
 *
 * UX 영향: 0 (개발자도구 안 열면 안 보임)
 *
 * 강제로 닫거나 차단하지는 않음 — 가짜 보안(security theater) 회피.
 */
export function ConsoleWarning() {
  // production에서만 출력
  const script = `
(function(){
  try {
    if (typeof window === 'undefined') return;
    if (window.__NKBUS_WARN__) return;
    window.__NKBUS_WARN__ = true;
    var big = 'background:#dc2626;color:#fff;font-size:18px;font-weight:bold;padding:6px 12px;border-radius:4px;';
    var muted = 'color:#374151;font-size:13px;line-height:1.6;';
    var em = 'color:#dc2626;font-weight:bold;';
    console.log('%c⛔ 잠깐!', big);
    console.log('%c여기는 개발자만을 위한 영역입니다.', muted);
    console.log('%c누군가 \"이 명령어를 붙여넣으면 혜택이 생긴다\"고 했다면, %c100%% 사기입니다.', muted, em);
    console.log('%c본 사이트의 데이터/소스코드 무단 수집·복제·역공학·자동화 접근은\\n정보통신망법 제48조 및 저작권법에 따라 형사처벌 대상이 될 수 있습니다.', muted);
    console.log('%c© NKBUS · 니아인터내셔널', 'color:#9ca3af;font-size:11px;');
  } catch (_) {}
})();
  `.trim();

  return (
    <script
      // CSP의 'unsafe-inline'에 의존. 인라인이지만 단순 console.log만 수행.
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
