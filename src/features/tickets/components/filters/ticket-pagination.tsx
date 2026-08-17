"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

interface TicketPaginationProps {
  page: number;
  totalPages: number;
  isPending: boolean;
  onPageChange: (page: number) => void;
}

export function TicketPagination({
  page,
  totalPages,
  isPending,
  onPageChange,
}: TicketPaginationProps) {
  const t = useTranslations("tickets.list");

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t pt-3 text-xs">
      <span className="text-muted-foreground">
        {t("pageOf", { current: page.toLocaleString(), total: totalPages.toLocaleString() })}
      </span>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || isPending}
          onClick={() => onPageChange(page - 1)}
          className="h-8 gap-1 px-2.5 text-xs"
        >
          <ChevronRight className="h-3.5 w-3.5" />
          <span>{t("prev")}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || isPending}
          onClick={() => onPageChange(page + 1)}
          className="h-8 gap-1 px-2.5 text-xs"
        >
          <span>{t("next")}</span>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
