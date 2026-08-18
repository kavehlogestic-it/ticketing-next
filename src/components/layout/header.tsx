import { Headphones, Plus, User as UserIcon } from "lucide-react";
import { Suspense } from "react";

import { LogoutButton } from "@/components/layout/logout-button";
import { MobileNav } from "@/components/layout/mobile-nav";
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
      {/* Desktop Navigation Links */}
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

      {/* Quick Create Ticket for Normal Users (Desktop / Tablet) */}
      {!responder ? (
        <Button asChild size="sm" className="hidden lg:inline-flex gap-1.5 text-xs shadow-2xs">
          <Link href="/tickets/new">
            <Plus className="h-3.5 w-3.5" />
            <span>{t.nav.newTicket}</span>
          </Link>
        </Button>
      ) : null}

      {/* Notification Bell */}
      <NotificationBell />

      {/* User Profile Pill (Responsive) */}
      <div className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-border bg-muted/30 px-2 sm:px-3 py-1 text-xs max-w-[140px] sm:max-w-[220px]">
        {responder ? (
          <Headphones className="h-3.5 w-3.5 text-primary shrink-0" />
        ) : (
          <UserIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        <span className="font-medium text-foreground truncate text-[11px] sm:text-xs">
          {user.fullName || user.username}
        </span>
        <Badge
          variant={responder ? "default" : "outline"}
          className="hidden sm:inline-flex text-[10px] py-0 px-1.5 h-4 shrink-0"
        >
          {responder ? t.roles.responder : t.roles.user}
        </Badge>
      </div>

      {/* Desktop Logout Button */}
      <div className="hidden md:block">
        <LogoutButton />
      </div>

      {/* Mobile Hamburger Drawer Menu */}
      <MobileNav user={user} responder={responder} t={t} />
    </>
  );
}

function HeaderUserSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-7 w-20 sm:w-28 animate-pulse rounded-full bg-muted/60" />
    </div>
  );
}

export function Header({ locale = "fa" }: HeaderProps) {
  const t = getStaticMessages(locale).common;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm shrink-0">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 sm:gap-6 min-w-0">
          <Link href="/dashboard" className="flex items-center gap-1.5 sm:gap-2.5 font-bold text-foreground shrink-0">
            <div className="relative flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-xl overflow-hidden shadow-xs border border-border/60 bg-slate-900 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/icon-192x192.png"
                alt={t.appName}
                className="h-full w-full object-cover rounded-xl"
              />
            </div>
            <span className="text-xs sm:text-base font-extrabold tracking-tight">
              <span className="inline sm:hidden">تیکتینگ</span>
              <span className="hidden sm:inline">{t.appName}</span>
            </span>
          </Link>
        </div>

        {/* Dynamic User Navigation & Profile Section (Streams in) */}
        <div className="flex items-center gap-1.5 sm:gap-3">
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
