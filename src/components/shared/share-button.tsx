"use client";

import { Share2, Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function ShareButton({ url, title, size = "icon" }: { url: string; title?: string; size?: "icon" | "default" }) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("Common");

  const handleShare = async () => {
    const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${url}` : url;

    if (navigator.share) {
      try {
        await navigator.share({ title: title || "NOVAREN", url: fullUrl });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success(t("linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  if (size === "default") {
    return (
      <Button type="button" variant="outline" onClick={handleShare} className="gap-2">
        {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        {t("share")}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="shrink-0 w-12 h-12 border border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)] transition-colors flex items-center justify-center"
      aria-label={t("share")}
    >
      {copied ? (
        <Check className="w-5 h-5" strokeWidth={1.5} />
      ) : (
        <Share2 className="w-5 h-5" strokeWidth={1.5} />
      )}
    </button>
  );
}
