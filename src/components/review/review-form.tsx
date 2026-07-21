"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createReview } from "@/actions/review";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/shared/image-upload";
import { useTranslations } from "next-intl";

export function ReviewForm({
  productId,
  hasReviewed,
}: {
  productId: string;
  hasReviewed: boolean;
}) {
  const [state, formAction, isPending] = useActionState(createReview, null);
  const t = useTranslations("Common");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success(t("reviewSubmitted"));
      formRef.current?.reset();
      setRating(0);
      setImageUrls([]);
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  if (hasReviewed) {
    return (
      <Card className="bg-gray-50">
        <CardContent className="py-4 text-center text-sm text-gray-500">
          {t("alreadyReviewed")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-5">
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="rating" value={rating} />
          <input type="hidden" name="imageUrls" value={JSON.stringify(imageUrls)} />

          {/* Star rating */}
          <div>
            <p className="text-sm font-medium mb-2">{t("rating")}</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHoveredRating(s)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-0.5"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      s <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-200"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="text-sm text-gray-500 ml-2 self-center">
                  {t("ratingPoint", { n: rating })}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div>
            <Textarea
              name="content"
              placeholder={t("reviewPlaceholder")}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Images */}
          <div>
            <p className="text-sm font-medium mb-2">{t("attachPhoto")}</p>
            <ImageUpload
              category="reviews"
              maxFiles={5}
              value={imageUrls}
              onChange={setImageUrls}
            />
          </div>

          {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

          <Button
            type="submit"
            disabled={isPending || rating === 0}
            className="w-full bg-black hover:bg-gray-800 text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> {t("submitting")}
              </>
            ) : (
              t("submitReview")
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
