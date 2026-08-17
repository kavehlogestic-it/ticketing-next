"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { TicketPagination } from "@/features/tickets/components/filters/ticket-pagination";
import { TicketSearchBar } from "@/features/tickets/components/filters/ticket-search-bar";
import { TicketStatusTabs } from "@/features/tickets/components/filters/ticket-status-tabs";

interface TicketFiltersProps {
  total: number;
  page: number;
  pageSize: number;
  currentStatus?: string;
  currentSearch?: string;
}

export function TicketFilters({
  total,
  page,
  pageSize,
  currentStatus = "",
  currentSearch = "",
}: TicketFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const updateFilters = (newParams: { status?: string; search?: string; page?: number }) => {
    const params = new URLSearchParams(searchParams?.toString());

    if (newParams.status !== undefined) {
      if (newParams.status) params.set("status", newParams.status);
      else params.delete("status");
      params.set("page", "1"); // Reset page on filter change
    }

    if (newParams.search !== undefined) {
      if (newParams.search.trim()) params.set("search", newParams.search.trim());
      else params.delete("search");
      params.set("page", "1"); // Reset page on search change
    }

    if (newParams.page !== undefined) {
      params.set("page", String(newParams.page));
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}` as Parameters<typeof router.push>[0]);
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Input & Total Count */}
      <TicketSearchBar
        currentSearch={currentSearch}
        total={total}
        onSearchChange={(search) => updateFilters({ search })}
      />

      {/* Status Filter Tabs */}
      <TicketStatusTabs
        currentStatus={currentStatus}
        onStatusChange={(status) => updateFilters({ status })}
      />

      {/* Pagination Controls */}
      <TicketPagination
        page={page}
        totalPages={totalPages}
        isPending={isPending}
        onPageChange={(p) => updateFilters({ page: p })}
      />
    </div>
  );
}
