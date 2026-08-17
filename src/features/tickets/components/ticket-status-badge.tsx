"use client";

import { useTranslations } from "next-intl";

import { getStatusMeta } from "@/lib/constants/ticket-status";
import { cn } from "@/utils/cn";

interface TicketStatusBadgeProps {
  status: string | null | undefined;
  className?: string;
  showDot?: boolean;
}

export function TicketStatusBadge({
  status,
  className,
  showDot = true,
}: TicketStatusBadgeProps) {
  const t = useTranslations("common");
  const meta = getStatusMeta(status);

  // Map internal status keys to translation dictionary
  const statusKeyMap: Record<string, string> = {
    open: "status.pending",
    under_review: "status.underReview",
    in_progress: "status.inProgress",
    read: "status.read",
    closed: "status.closed",
  };

  const translationKey = statusKeyMap[meta.key];
  const label = translationKey ? t(translationKey as Parameters<typeof t>[0]) : meta.labelFa;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        meta.bgClass,
        meta.textClass,
        meta.borderClass,
        className,
      )}
    >
      {showDot && (
        <span
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dotClass)}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </span>
  );
}
