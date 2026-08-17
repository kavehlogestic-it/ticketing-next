"use client";

import { useTranslations } from "next-intl";

interface AppFooterProps {
  className?: string;
  subtext?: string;
}

export function AppFooter({ className, subtext }: AppFooterProps) {
  const t = useTranslations("common");
  const year = new Date().getFullYear();

  return (
    <footer className={className || "border-t py-4 text-center text-xs text-muted-foreground mt-auto bg-card/40"}>
      © {year} {subtext || t("appName")} — تمامی حقوق محفوظ است.
    </footer>
  );
}
