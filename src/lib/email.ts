import nodemailer from "nodemailer";

/**
 * 트랜잭션 메일 발송 (SMTP).
 *
 * 필요 env:
 * - SMTP_HOST      예: smtp.naver.com / smtp.gmail.com
 * - SMTP_PORT      예: 465(SSL) 또는 587(STARTTLS). 기본 465
 * - SMTP_USER      SMTP 로그인 계정
 * - SMTP_PASS      SMTP 비밀번호(네이버/구글은 "앱 비밀번호" 발급 필요)
 * - EMAIL_FROM     보내는 주소 표기. 기본 SMTP_USER
 *
 * 미설정 시 isEmailConfigured() = false — 호출부는 사용자에게
 * 정직한 안내(고객센터 문의)를 보여줘야 하며, 발송된 척하면 안 된다.
 */

const SMTP_HOST = process.env.SMTP_HOST ?? "";
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 465);
const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASS = process.env.SMTP_PASS ?? "";
const EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER;

export function isEmailConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

function getTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // 465=SSL, 그 외(587)=STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error("SMTP 미설정 — SMTP_HOST/SMTP_USER/SMTP_PASS 환경변수 필요");
  }
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"NOVAREN" <${EMAIL_FROM}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

/** 비밀번호 재설정 메일 본문 */
export function passwordResetEmailHtml(resetUrl: string): string {
  return `
<div style="max-width:480px;margin:0 auto;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#111">
  <div style="padding:32px 0 24px;text-align:center;border-bottom:2px solid #111">
    <span style="font-size:22px;font-weight:900;letter-spacing:2px">NOVAREN</span>
  </div>
  <div style="padding:32px 8px">
    <h1 style="font-size:18px;font-weight:700;margin:0 0 16px">비밀번호 재설정 안내</h1>
    <p style="font-size:14px;line-height:1.7;color:#444;margin:0 0 24px">
      비밀번호 재설정 요청을 받았습니다.<br/>
      아래 버튼을 눌러 새 비밀번호를 설정해주세요. 링크는 <strong>1시간</strong> 동안만 유효합니다.
    </p>
    <a href="${resetUrl}"
       style="display:block;text-align:center;background:#111;color:#fff;text-decoration:none;padding:14px 0;border-radius:8px;font-size:14px;font-weight:700">
      비밀번호 재설정하기
    </a>
    <p style="font-size:12px;line-height:1.7;color:#999;margin:24px 0 0">
      버튼이 눌리지 않으면 다음 주소를 브라우저에 붙여넣어 주세요.<br/>
      <span style="word-break:break-all;color:#666">${resetUrl}</span>
    </p>
    <p style="font-size:12px;line-height:1.7;color:#999;margin:16px 0 0">
      본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다. 비밀번호는 변경되지 않습니다.
    </p>
  </div>
  <div style="padding:20px 8px;border-top:1px solid #eee;font-size:11px;color:#aaa;line-height:1.6">
    (주)니아인터내셔널 · 고객센터 1544-7199 (평일 09:00~18:00)<br/>
    본 메일은 발신 전용입니다.
  </div>
</div>`;
}
