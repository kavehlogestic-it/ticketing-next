"use client";

import { useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { TicketPagination } from "@/features/tickets/components/filters/ticket-pagination";
import { TicketSearchBar } from "@/features/tickets/components/filters/ticket-search-bar";
import { TicketStatusTabs } from "@/features/tickets/components/filters/ticket-status-tabs";
import { TicketUserGroupFilter } from "@/features/tickets/components/filters/ticket-user-group-filter";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { UserGroup } from "@/types/ticket";

interface TicketFiltersProps {
  total: number;
  page: number;
  pageSize: number;
  currentStatus?: string;
  currentSearch?: string;
  currentUserGroupType?: string;
  userGroups?: UserGroup[];
  showUserGroupFilter?: boolean;
}

export function TicketFilters({
  total,
  page,
  pageSize,
  currentStatus = "",
  currentSearch = "",
  currentUserGroupType = "",
  userGroups = [],
  showUserGroupFilter = false,
}: TicketFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const updateFilters = (newParams: {
    status?: string;
    search?: string;
    page?: number;
    userGroupType?: string;
  }) => {
    const params = new URLSearchParams(searchParams?.toString() || "");

    if (newParams.status !== undefined) {
      if (newParams.status && newParams.status !== "all") {
        params.set("status", newParams.status);
      } else {
        params.delete("status");
      }
      params.set("page", "1"); // Reset page on filter change
    }

    if (newParams.search !== undefined) {
      if (newParams.search.trim()) {
        params.set("search", newParams.search.trim());
      } else {
        params.delete("search");
      }
      params.set("page", "1"); // Reset page on search change
    }

    if (newParams.userGroupType !== undefined) {
      if (newParams.userGroupType && newParams.userGroupType !== "all" && newParams.userGroupType !== "") {
        params.set("userGroupType", newParams.userGroupType);
      } else {
        params.delete("userGroupType");
      }
      params.set("page", "1"); // Reset page on userGroupType change
    }

    if (newParams.page !== undefined) {
      params.set("page", String(newParams.page));
    }

    const queryString = params.toString();
    const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;

    startTransition(() => {
      router.push(targetUrl as Parameters<typeof router.push>[0]);
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Input, User Group Filter & Total Count */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1">
          <TicketSearchBar
            currentSearch={currentSearch}
            total={total}
            onSearchChange={(search) => updateFilters({ search })}
          />
        </div>
        {showUserGroupFilter && userGroups.length > 0 && (
          <TicketUserGroupFilter
            userGroups={userGroups}
            currentUserGroupType={currentUserGroupType}
            onUserGroupChange={(userGroupType) => updateFilters({ userGroupType })}
          />
        )}
      </div>

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
