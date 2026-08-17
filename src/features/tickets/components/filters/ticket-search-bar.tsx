"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";

interface TicketSearchBarProps {
  currentSearch: string;
  total: number;
  onSearchChange: (search: string) => void;
}

export function TicketSearchBar({
  currentSearch,
  total,
  onSearchChange,
}: TicketSearchBarProps) {
  const t = useTranslations("tickets.list");

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const searchInput = form.elements.namedItem("search") as HTMLInputElement;
          onSearchChange(searchInput.value);
        }}
        className="relative flex-1 max-w-md"
      >
        <Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          name="search"
          defaultValue={currentSearch}
          placeholder={t("searchPlaceholder")}
          className="ps-9 pe-9"
        />
        {currentSearch ? (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute end-3 top-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </form>

      <div className="text-xs text-muted-foreground">
        <span>
          {t("totalTickets", { count: total.toLocaleString() })}
        </span>
      </div>
    </div>
  );
}
