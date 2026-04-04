"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { toggleReleaseNotify } from "@/actions/release";
import { toast } from "sonner";

export function NotifyButton({
  releaseId,
  initialCount,
}: {
  releaseId: string;
  initialCount: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [notified, setNotified] = useState(false);
  const [count, setCount] = useState(initialCount);

  function handleClick() {
    if (notified) {
      toast.info("이미 알림 신청되었습니다.");
      return;
    }

    startTransition(async () => {
      const result = await toggleReleaseNotify(releaseId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setNotified(true);
      setCount((c) => c + 1);
      toast.success("발매 알림이 등록되었습니다!");
    });
  }

  return (
    <Button
      variant={notified ? "default" : "outline"}
      size="sm"
      className={`w-full mt-3 gap-1.5 ${notified ? "bg-black text-white hover:bg-gray-800" : ""}`}
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : notified ? (
        <BellRing className="w-3.5 h-3.5" />
      ) : (
        <Bell className="w-3.5 h-3.5" />
      )}
      {notified ? "알림 신청완료" : "알림"} ({count.toLocaleString()})
    </Button>
  );
}
