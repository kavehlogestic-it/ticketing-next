import { Headphones, LifeBuoy, Plus, User as UserIcon } from "lucide-react";
import { Suspense } from "react";

import { LogoutButton } from "@/components/layout/logout-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { Link } from "@/i18n/navigation";
import { getStaticMessages } from "@/i18n/request";
import { isResponder } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";

interface HeaderProps {
  locale?: string;
}

async function HeaderUserNav({ locale = "fa" }: HeaderProps) {
  const t = getStaticMessages(locale).common;
  const user = await getCurrentUser();
  const responder = isResponder(user);

  if (!user) {
    return (
      <Button asChild size="sm" variant="default" className="text-xs">
        <Link href="/">{t.actions.login}</Link>
      </Button>
    );
  }

  return (
    <>
      <nav className="hidden items-center gap-1 md:flex">
        <Link
          href="/dashboard"
          className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {t.nav.dashboard}
        </Link>
        <Link
          href="/tickets"
          className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {t.nav.tickets}
        </Link>
        {responder ? (
          <Link
            href="/groups"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {t.nav.groups}
          </Link>
        ) : null}
      </nav>

      {/* Quick Create Ticket for Normal Users */}
      {!responder ? (
        <Button asChild size="sm" className="hidden sm:inline-flex gap-1.5 text-xs shadow-2xs">
          <Link href="/tickets/new">
            <Plus className="h-3.5 w-3.5" />
            <span>{t.nav.newTicket}</span>
          </Link>
        </Button>
      ) : null}

      {/* Notification Bell */}
      <NotificationBell />

      {/* User Profile Pill */}
      <div className="flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs">
        {responder ? (
          <Headphones className="h-3.5 w-3.5 text-primary" />
        ) : (
          <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className="font-medium text-foreground max-w-[120px] sm:max-w-[160px] truncate">
          {user.fullName || user.username}
        </span>
        <Badge
          variant={responder ? "default" : "outline"}
          className="text-[10px] py-0 px-1.5 h-4"
        >
          {responder ? t.roles.responder : t.roles.user}
        </Badge>
      </div>

      <LogoutButton />
    </>
  );
}

function HeaderUserSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-7 w-24 animate-pulse rounded-full bg-muted/60" />
    </div>
  );
}

export function Header({ locale = "fa" }: HeaderProps) {
  const t = getStaticMessages(locale).common;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm shrink-0">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-foreground">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden shadow-xs border border-border/60 bg-slate-900 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/icon-192x192.png"
                alt={t.appName}
                className="h-full w-full object-cover rounded-xl"
              />
            </div>
            <span className="text-base font-extrabold tracking-tight">
              {t.appName}
            </span>
          </Link>
        </div>

        {/* Dynamic User Navigation & Profile Section (Streams in) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Suspense fallback={<HeaderUserSkeleton />}>
            <HeaderUserNav locale={locale} />
          </Suspense>

          <div className="h-4 w-[1px] bg-border mx-0.5" />

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
