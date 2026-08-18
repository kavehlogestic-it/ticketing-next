import "@/styles/globals.css";

import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { Suspense } from "react";

import { Header } from "@/components/layout/header";
import { getStaticMessages } from "@/i18n/request";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/helpers/cn";
import { AppProviders } from "@/providers/app-providers";

export const instant = false;

const vazirmatn = localFont({
  src: [
    {
      path: "../../../public/fonts/Vazirmatn-Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../../public/fonts/Vazirmatn-ExtraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../../public/fonts/Vazirmatn-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../../public/fonts/Vazirmatn-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/fonts/Vazirmatn-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../public/fonts/Vazirmatn-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../../public/fonts/Vazirmatn-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../../public/fonts/Vazirmatn-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../../public/fonts/Vazirmatn-Black.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-vazirmatn",
  display: "swap",
});

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const messages = getStaticMessages(locale);
  const metadata = messages.metadata as { title?: string; description?: string };

  return {
    title: metadata?.title || "سامانه پشتیبانی و تیکتینگ",
    description: metadata?.description || "سیستم تیکتینگ سازمانی",
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = getStaticMessages(locale);

  return (
    <html
      lang={locale}
      dir={locale === "fa" ? "rtl" : "ltr"}
      className={vazirmatn.variable}
      suppressHydrationWarning
    >
      <body
        className={cn(
          "h-screen max-h-screen overflow-hidden flex flex-col bg-background font-sans antialiased",
          vazirmatn.className,
        )}
        cz-shortcut-listen="true"
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <AppProviders>
            <Header locale={locale} />
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <Suspense
                fallback={
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                }
              >
                {children}
              </Suspense>
            </div>
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
