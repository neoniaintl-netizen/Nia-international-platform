import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

/** 환경변수가 설정된 소셜 provider 만 노출 (미설정 버튼 숨김). */
function enabledSocialProviders(): ("kakao" | "naver")[] {
  const list: ("kakao" | "naver")[] = [];
  if (process.env.AUTH_KAKAO_ID && process.env.AUTH_KAKAO_SECRET) list.push("kakao");
  if (process.env.AUTH_NAVER_ID && process.env.AUTH_NAVER_SECRET) list.push("naver");
  return list;
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm socialProviders={enabledSocialProviders()} />
    </Suspense>
  );
}
