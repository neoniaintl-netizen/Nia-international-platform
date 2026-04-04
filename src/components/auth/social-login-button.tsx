"use client";

import { Button } from "@/components/ui/button";
import { socialLoginAction } from "@/actions/auth";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

const PROVIDERS = {
  kakao: {
    label: "카카오 로그인",
    icon: "K",
    bg: "#FEE500",
    border: "#FEE500",
    color: "#191919",
  },
  naver: {
    label: "네이버 로그인",
    icon: "N",
    bg: "#03C75A",
    border: "#03C75A",
    color: "#ffffff",
  },
} as const;

export function SocialLoginButton({ provider }: { provider: "kakao" | "naver" }) {
  const [isPending, startTransition] = useTransition();
  const config = PROVIDERS[provider];

  function handleClick() {
    startTransition(async () => {
      await socialLoginAction(provider);
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={isPending}
      className="w-full h-12 rounded-lg text-sm font-medium gap-2 cursor-pointer"
      style={{ backgroundColor: config.bg, borderColor: config.border, color: config.color }}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <span className="font-black text-base">{config.icon}</span>
      )}
      {config.label}
    </Button>
  );
}
