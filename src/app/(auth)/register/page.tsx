import { RegisterForm } from "@/components/auth/register-form";

/** 환경변수가 설정된 소셜 provider 만 노출 (미설정 버튼 숨김). */
function enabledSocialProviders(): ("kakao" | "naver")[] {
  const list: ("kakao" | "naver")[] = [];
  if (process.env.AUTH_KAKAO_ID && process.env.AUTH_KAKAO_SECRET) list.push("kakao");
  if (process.env.AUTH_NAVER_ID && process.env.AUTH_NAVER_SECRET) list.push("naver");
  return list;
}

export default function RegisterPage() {
  return <RegisterForm socialProviders={enabledSocialProviders()} />;
}
