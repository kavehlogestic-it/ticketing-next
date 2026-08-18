import { FileQuestion, Plus, Ticket as TicketIcon } from "lucide-react";
import { getLocale } from "next-intl/server";
import { Suspense } from "react";

import TicketsLoading from "@/app/[locale]/tickets/loading";
import { getCachedTickets, getCachedUserGroups } from "@/cache";
import { AppFooter } from "@/components/layout/app-footer";
import { Button } from "@/components/ui/button";
import { TicketCard } from "@/features/tickets/components/ticket-card";
import { TicketFilters } from "@/features/tickets/components/ticket-filters";
import { TicketTable } from "@/features/tickets/components/ticket-table";
import { Link, redirect } from "@/i18n/navigation";
import { isResponder, isTicketIssuer } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccessToken } from "@/lib/auth/token-store";
import type { PaginatedTickets, UserGroup } from "@/types/ticket";

interface TicketsContentProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    status?: string;
    search?: string;
    userGroupType?: string;
  }>;
}

async function TicketsContent({ searchParams }: TicketsContentProps) {
  const locale = await getLocale();
  const user = await getCurrentUser();
  const token = await getAccessToken();

  if (!user) {
    redirect({ href: "/", locale });
    return null;
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const pageSize = parseInt(params.pageSize || "20", 10);
  const status = params.status || "";
  const search = params.search || "";
  const userGroupType = params.userGroupType || "";

  const responder = isResponder(user);
  const issuer = isTicketIssuer(user);

  let ticketsData: PaginatedTickets = { total: 0, page: 1, pageSize: 20, items: [] };
  let userGroups: UserGroup[] = [];
  let fetchError: string | null = null;

  try {
    const [ticketsRes, groupsRes] = await Promise.all([
      getCachedTickets(
        {
          page,
          pageSize,
          status: status || undefined,
          search: search || undefined,
          userGroupType: responder ? (userGroupType || undefined) : undefined,
        },
        token,
      ),
      responder ? getCachedUserGroups(token) : Promise.resolve([]),
    ]);

    ticketsData = ticketsRes;
    userGroups = groupsRes;
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "خطا در دریافت لیست تیکت‌ها";
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <TicketIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                مدیریت تیکت‌ها
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                مشاهده، جستجو و پیگیری وضعیت تیکت‌های پشتیبانی
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {issuer && (
            <Button asChild size="default" className="gap-2 shadow-xs">
              <Link href="/tickets/new">
                <Plus className="h-4 w-4" />
                <span>ثبت تیکت جدید</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <TicketFilters
        total={ticketsData.total}
        page={ticketsData.page}
        pageSize={ticketsData.pageSize}
        currentStatus={status}
        currentSearch={search}
        currentUserGroupType={userGroupType}
        userGroups={userGroups}
        showUserGroupFilter={responder}
      />

      {/* Error state */}
      {fetchError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {fetchError}
        </div>
      )}

      {/* Tickets Content */}
      {ticketsData.items.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <TicketTable tickets={ticketsData.items} />
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {ticketsData.items.map((ticket) => (
              <TicketCard key={ticket.ticketId} ticket={ticket} />
            ))}
          </div>
        </>
      ) : !fetchError ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground space-y-3">
          <FileQuestion className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-foreground">
            هیچ تیکتی با مشخصات مورد نظر یافت نشد.
          </p>
          <p className="text-xs">
            فیلترها یا عبارت جستجوی خود را تغییر دهید.
          </p>
          {issuer && (
            <Button asChild size="sm" className="mt-3 gap-1.5">
              <Link href="/tickets/new">
                <Plus className="h-4 w-4" />
                <span>ثبت تیکت جدید</span>
              </Link>
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

interface TicketsPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    status?: string;
    search?: string;
    userGroupType?: string;
  }>;
}

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const sp = await searchParams;
  const key = `${sp.page || "1"}_${sp.status || ""}_${sp.search || ""}_${sp.userGroupType || ""}`;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-between">
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Suspense key={key} fallback={<TicketsLoading />}>
          <TicketsContent searchParams={searchParams} />
        </Suspense>
      </main>
      <AppFooter />
    </div>
  );
}
