"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Headphones,
  Layers,
  Search,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiStatCard } from "@/features/dashboard/components/kpi-stat-card";
import { TicketCard } from "@/features/tickets/components/ticket-card";
import { TicketTable } from "@/features/tickets/components/ticket-table";
import { Link } from "@/i18n/navigation";
import type { PaginatedTickets, TicketSummary, User } from "@/types/ticket";

interface ResponderDashboardProps {
  user: User;
  ticketsData: PaginatedTickets;
  openCount?: number;
  underReviewCount?: number;
  inProgressCount?: number;
  closedCount?: number;
  attentionTickets?: TicketSummary[];
}

export function ResponderDashboard({
  user,
  ticketsData,
  openCount = 0,
  underReviewCount = 0,
  inProgressCount = 0,
  closedCount = 0,
  attentionTickets = [],
}: ResponderDashboardProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const recentTickets = ticketsData.items.slice(0, 8);

  const stats = [
    {
      title: t("totalTickets"),
      value: ticketsData.total,
      icon: Ticket,
      description: t("totalTicketsResponderDesc"),
      color: "text-foreground",
      bg: "bg-primary/10 text-primary border border-primary/20",
    },
    {
      title: t("pendingReview"),
      value: openCount,
      icon: Clock,
      description: t("pendingReviewDesc"),
      color: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    },
    {
      title: tCommon("status.underReview"),
      value: underReviewCount,
      icon: AlertTriangle,
      description: t("inProgressDesc"),
      color: "text-blue-700 dark:text-blue-400",
      bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
    },
    {
      title: t("inProgress"),
      value: inProgressCount,
      icon: Layers,
      description: t("inProgressDesc"),
      color: "text-purple-700 dark:text-purple-400",
      bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
    },
    {
      title: t("closed"),
      value: closedCount,
      icon: CheckCircle,
      description: t("closedDesc"),
      color: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Responder Welcome Banner */}
      <div className="rounded-2xl border border-primary/20 bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {t("welcomeResponder", { name: user.fullName || user.username })}
              </h1>
              <Badge variant="default" className="gap-1 text-xs">
                <ShieldCheck className="h-3 w-3" />
                <span>{tCommon("roles.responder")}</span>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              {t("responderSubtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="default" className="gap-2 shadow-xs">
              <Link href="/tickets">
                <Search className="h-4 w-4" />
                <span>{t("manageTickets")}</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="default" className="gap-2">
              <Link href="/groups">
                <span>{t("userGroups")}</span>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((item) => (
          <KpiStatCard key={item.title} item={item} />
        ))}
      </div>

      {/* Attention Required Section */}
      {attentionTickets.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-bold text-foreground">
                {t("attentionRequired")}
              </h2>
            </div>
            <Badge variant="warning" className="text-xs">
              {t("priorityTickets", { count: attentionTickets.length })}
            </Badge>
          </div>

          <div className="hidden md:block">
            <TicketTable tickets={attentionTickets.slice(0, 5)} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {attentionTickets.slice(0, 5).map((tItem) => (
              <TicketCard key={tItem.ticketId} ticket={tItem} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Recent Tickets Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            {t("recentTicketsResponder")}
          </h2>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-foreground">
            <Link href="/tickets">
              <span>{t("seeAll")}</span>
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {recentTickets.length > 0 ? (
          <>
            <div className="hidden md:block">
              <TicketTable tickets={recentTickets} />
            </div>
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {recentTickets.map((tItem) => (
                <TicketCard key={tItem.ticketId} ticket={tItem} />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground bg-card">
            <Headphones className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
            <p>{t("noTickets")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
