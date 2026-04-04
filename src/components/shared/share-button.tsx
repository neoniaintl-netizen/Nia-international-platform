"use client";

import { Share2, Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export function ShareButton({ url, title, size = "icon" }: { url: string; title?: string; size?: "icon" | "default" }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${url}` : url;

    if (navigator.share) {
      try {
        await navigator.share({ title: title || "NKBUS", url: fullUrl });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success("링크가 복사되었습니다.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("복사에 실패했습니다.");
    }
  };

  if (size === "default") {
    return (
      <Button type="button" variant="outline" onClick={handleShare} className="gap-2">
        {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        공유
      </Button>
    );
  }

  return (
    <Button type="button" variant="outline" size="icon" onClick={handleShare}>
      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
    </Button>
  );
}
