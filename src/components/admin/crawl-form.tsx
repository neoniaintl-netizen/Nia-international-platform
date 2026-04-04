"use client";

import { useActionState, useEffect } from "react";
import { startCrawlJob } from "@/actions/crawl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Rocket } from "lucide-react";
import { toast } from "sonner";
import { SUPPORTED_SITES } from "@/lib/crawler";

export function CrawlForm() {
  const [state, formAction, isPending] = useActionState(startCrawlJob, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("크롤링이 완료되었습니다!");
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

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
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                required
              >
                {SUPPORTED_SITES.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm mb-1.5">대상 URL</Label>
              <Input
                name="targetUrl"
                placeholder="https://www.musinsa.com/ranking/best"
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
