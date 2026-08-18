"use client";

import {
  FolderKanban,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Ticket as TicketIcon,
  User as UserIcon,
  X,
} from "lucide-react";
import { useState } from "react";

import { logoutAction } from "@/features/auth/actions/logout-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link, usePathname } from "@/i18n/navigation";
import type { User } from "@/types/ticket";

interface MobileNavProps {
  user: User | null;
  responder: boolean;
  t: {
    nav: {
      dashboard: string;
      tickets: string;
      newTicket: string;
      groups: string;
    };
    roles: {
      responder: string;
      user: string;
    };
    actions: {
      logout: string;
      login: string;
    };
    appName: string;
  };
}

export function MobileNav({ user, responder, t }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      label: t.nav.dashboard,
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      href: "/tickets",
      label: t.nav.tickets,
      icon: TicketIcon,
      active: pathname === "/tickets",
    },
    ...(!responder
      ? [
          {
            href: "/tickets/new",
            label: t.nav.newTicket,
            icon: Plus,
            active: pathname === "/tickets/new",
          },
        ]
      : []),
    ...(responder
      ? [
          {
            href: "/groups",
            label: t.nav.groups,
            icon: FolderKanban,
            active: pathname === "/groups",
          },
        ]
      : []),
  ];

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-9 w-9 md:hidden text-foreground hover:bg-muted"
        aria-label="منوی ناوبری"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs p-5 bg-card border-border shadow-2xl rounded-2xl" dir="rtl">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-3 text-right">
            <div className="flex items-center gap-2.5">
              <div className="relative h-8 w-8 rounded-xl overflow-hidden shadow-xs border border-border bg-slate-900 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/icon-192x192.png"
                  alt="لوگو"
                  className="h-full w-full object-cover"
                />
              </div>
              <DialogTitle className="text-base font-bold text-foreground">
                {t.appName}
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* User Profile Card */}
          {user ? (
            <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/40 p-3 my-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {responder ? (
                  <Headphones className="h-4 w-4" />
                ) : (
                  <UserIcon className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs text-foreground truncate">
                  {user.fullName || user.username}
                </p>
                <Badge
                  variant={responder ? "default" : "outline"}
                  className="text-[10px] py-0 px-1.5 h-4 mt-0.5"
                >
                  {responder ? t.roles.responder : t.roles.user}
                </Badge>
              </div>
            </div>
          ) : null}

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    item.active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          {user ? (
            <div className="pt-2 border-t mt-auto">
              <form action={logoutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  className="w-full justify-start gap-2.5 h-9 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t.actions.logout}</span>
                </Button>
              </form>
            </div>
          ) : (
            <div className="pt-2 border-t mt-auto">
              <Button asChild className="w-full h-9 text-xs rounded-xl" onClick={() => setOpen(false)}>
                <Link href="/">{t.actions.login}</Link>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
