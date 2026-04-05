"use client";

import { useActionState, useEffect, useState } from "react";
import { startCrawlJob } from "@/actions/crawl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Rocket, Zap, Globe } from "lucide-react";
import { toast } from "sonner";
import { SUPPORTED_SITES, detectSite } from "@/lib/crawler";

export function CrawlForm() {
  const [state, formAction, isPending] = useActionState(startCrawlJob, null);
  const [selectedSite, setSelectedSite] = useState("musinsa");
  const [targetUrl, setTargetUrl] = useState("");

  useEffect(() => {
    if (state?.success) {
      toast.success("크롤링이 완료되었습니다!");
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  // URL 입력 시 사이트 자동 감지
  const handleUrlChange = (url: string) => {
    setTargetUrl(url);
    if (url.startsWith("http")) {
      try {
        const detected = detectSite(url);
        setSelectedSite(detected);
      } catch {
        // URL 파싱 실패 무시
      }
    }
  };

  const platformSites = SUPPORTED_SITES.filter((s) => s.category === "platform");
  const brandSites = SUPPORTED_SITES.filter((s) => s.category === "brand");
  const genericSites = SUPPORTED_SITES.filter((s) => s.category === "generic");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Rocket className="w-4 h-4" /> 새 크롤링 시작
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm mb-1.5">사이트</Label>
              <select
                name="sourceSite"
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                required
              >
                <optgroup label="🏬 대형 플랫폼">
                  {platformSites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🏷️ 브랜드 자사몰">
                  {brandSites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🌐 범용">
                  {genericSites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm mb-1.5">
                대상 URL
                {targetUrl && selectedSite !== "musinsa" && (
                  <span className="ml-2 text-[10px] text-blue-500 font-normal">
                    <Zap className="w-3 h-3 inline" /> 자동감지: {SUPPORTED_SITES.find((s) => s.id === selectedSite)?.name}
                  </span>
                )}
              </Label>
              <Input
                name="targetUrl"
                value={targetUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder={getPlaceholder(selectedSite)}
                required
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5">최대 수집 수</Label>
              <Input
                name="maxItems"
                type="number"
                defaultValue={30}
                min={1}
                max={200}
              />
            </div>
          </div>

          {/* 사이트별 안내 */}
          <SiteHint siteId={selectedSite} />

          {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
          {state?.success && (
            <p className="text-sm text-green-600">
              크롤링 완료! (Job ID: {state.jobId})
            </p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="bg-black hover:bg-gray-800 text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> 크롤링 중...
              </>
            ) : (
              "크롤링 시작"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function getPlaceholder(siteId: string): string {
  switch (siteId) {
    case "musinsa":
      return "https://www.musinsa.com/ranking/best 또는 상품 URL";
    case "29cm":
      return "https://shop.29cm.co.kr/best 또는 상품 URL";
    case "wconcept":
      return "https://www.wconcept.co.kr/Women 또는 상품 URL";
    case "cafe24":
      return "https://브랜드명.co.kr/product/list.html 또는 상품 URL";
    case "generic":
      return "아무 쇼핑몰 URL (상품 목록 또는 상품 상세)";
    default:
      return "크롤링할 URL을 입력하세요";
  }
}

function SiteHint({ siteId }: { siteId: string }) {
  const hints: Record<string, { icon: typeof Globe; text: string; color: string }> = {
    musinsa: {
      icon: Zap,
      text: "무신사 전용 크롤러 (가장 정확). 랭킹/카테고리/브랜드 페이지 또는 개별 상품 URL 지원",
      color: "text-green-600 bg-green-50",
    },
    "29cm": {
      icon: Zap,
      text: "29CM 전용 크롤러. __NEXT_DATA__ + meta 태그 기반 추출",
      color: "text-blue-600 bg-blue-50",
    },
    wconcept: {
      icon: Zap,
      text: "W Concept 전용 크롤러. 프리미엄/디자이너 브랜드 상품 추출",
      color: "text-purple-600 bg-purple-50",
    },
    cafe24: {
      icon: Globe,
      text: "Cafe24 기반 자사몰 크롤러. 국내 브랜드몰 70%+ 대응. 브랜드 사이트 URL을 입력하세요",
      color: "text-orange-600 bg-orange-50",
    },
    generic: {
      icon: Globe,
      text: "범용 크롤러 (OpenGraph / JSON-LD). 어떤 사이트든 기본적인 상품 정보 추출 시도",
      color: "text-gray-600 bg-gray-50",
    },
  };

  const hint = hints[siteId];
  if (!hint) return null;

  const Icon = hint.icon;

  return (
    <div className={`flex items-start gap-2 text-xs p-2.5 rounded-lg ${hint.color}`}>
      <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span>{hint.text}</span>
    </div>
  );
}
