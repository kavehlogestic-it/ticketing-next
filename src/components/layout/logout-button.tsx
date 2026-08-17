"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions/logout-action";

export function LogoutButton() {
  const t = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isPending}
      className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
      title={isPending ? t("actions.loggingOut") : t("actions.logout")}
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">
        {isPending ? t("actions.loggingOut") : t("actions.logout")}
      </span>
    </Button>
  );
}
