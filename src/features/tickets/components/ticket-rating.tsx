"use client";

import { AlertCircle, CheckCircle2, MessageSquare, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Spinner } from "@/components/common/spinner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { rateTicketAction } from "@/features/tickets/actions/rate-ticket-action";

interface TicketRatingProps {
  ticketId: number;
  existingRating?: number | null;
}

export function TicketRating({
  ticketId,
  existingRating = null,
}: TicketRatingProps) {
  const t = useTranslations("tickets.rating");
  const [rating, setRating] = useState<number>(existingRating || 0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [submittedRating, setSubmittedRating] = useState<number | null>(existingRating);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isLowRating = rating > 0 && rating < 3;

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      setError("لطفاً یک امتیاز از ۱ تا ۵ ستاره انتخاب کنید.");
      return;
    }

    if (isLowRating && !comment.trim()) {
      setError("برای امتیازهای کمتر از ۳ ستاره، نوشتن دلیل نارضایتی الزامی است.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await rateTicketAction(ticketId, rating, comment);
      if (res.success) {
        setSubmittedRating(rating);
        setSuccess(true);
      } else {
        setError(res.error || "سرویس ثبت امتیاز در بک‌اند در دسترس نیست.");
      }
    } catch {
      setError("سرویس ثبت امتیاز در بک‌اند در دسترس نیست.");
    } finally {
      setLoading(false);
    }
  };

  // If already rated / submitted
  if (submittedRating !== null && submittedRating > 0) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold text-foreground text-sm">
              {t("yourRating")}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("thankYou")}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= submittedRating
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-4">
      <div>
        <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500" />
          <span>{t("title")}</span>
        </h4>
        <p className="text-xs text-muted-foreground mt-1">
          {t("desc")}
        </p>
      </div>

      {/* Interactive Stars */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 py-1">
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= (hoverRating || rating);
              return (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={rating === star}
                  aria-label={`${star} star`}
                  disabled={loading}
                  onClick={() => {
                    setRating(star);
                    setError(null);
                  }}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 rounded-md transition-transform hover:scale-110 focus:outline-hidden focus:ring-2 focus:ring-ring"
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      isFilled
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/40 hover:text-amber-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {rating > 0 && (
            <span className="text-xs font-bold text-foreground font-mono ms-2">
              {t("ratingOf", { rating })}
            </span>
          )}
        </div>
      </div>

      {/* Description Field: Required if rating < 3, optional if rating >= 3 */}
      {rating > 0 && (
        <div className="space-y-1.5 pt-1 animate-in fade-in-50 duration-200">
          <Label htmlFor="rating-comment" className="text-xs font-semibold flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              {isLowRating ? t("lowRatingReason") : t("optionalComment")}
            </span>
            {isLowRating ? (
              <span className="text-destructive font-bold text-xs">{t("requiredBadge")}</span>
            ) : null}
          </Label>

          <Textarea
            id="rating-comment"
            rows={3}
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (error) setError(null);
            }}
            placeholder={
              isLowRating
                ? t("lowRatingPlaceholder")
                : t("optionalPlaceholder")
            }
            required={isLowRating}
            disabled={loading}
            className="text-xs bg-background resize-none focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      )}

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{t("success")}</span>
        </div>
      ) : null}

      <div className="flex justify-end pt-1">
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={loading || rating === 0}
          className="gap-2 shadow-xs"
        >
          {loading ? (
            <>
              <Spinner className="h-3.5 w-3.5" />
              <span>{t("submitting")}</span>
            </>
          ) : (
            <span>{t("submitRating")}</span>
          )}
        </Button>
      </div>
    </div>
  );
}
