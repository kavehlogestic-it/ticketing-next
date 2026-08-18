import { getLocale } from "next-intl/server";
import { Suspense } from "react";

import { AppFooter } from "@/components/layout/app-footer";
import { Badge } from "@/components/ui/badge";
import { LoginForm } from "@/features/auth/components/login-form";
import { LoginHeroShowcase } from "@/features/auth/components/login-hero-showcase";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";

async function AuthRedirectGuard() {
  const locale = await getLocale();
  const user = await getCurrentUser();

  // If user is already logged in, redirect immediately to dashboard
  if (user) {
    redirect({ href: "/dashboard", locale });
  }

  return null;
}

export default function RootLoginPage() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-between bg-background">
      <Suspense fallback={null}>
        <AuthRedirectGuard />
      </Suspense>

      <main className="container mx-auto flex flex-1 items-center justify-center px-4 py-8 lg:py-16 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full items-center">
          {/* Left Column (RTL Right side): Brand Hero & Capabilities Showcase */}
          <LoginHeroShowcase />

          {/* Right Column (RTL Left side): Authentication Form Card */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-md">
              <div className="space-y-2 pb-6 border-b mb-6 text-center sm:text-start">
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative h-10 w-10 rounded-xl overflow-hidden shadow-xs border border-border/60 bg-slate-900 shrink-0 p-0.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/icons/icon-192x192.png"
                      alt="لوگوی سامانه تیکتینگ"
                      className="h-full w-full object-cover rounded-lg"
                    />
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    پورتال دسترسی
                  </Badge>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  ورود به حساب کاربری
                </h2>
                <p className="text-xs text-muted-foreground">
                  نام کاربری و کلمه عبور سازمانی خود را وارد نمایید.
                </p>
              </div>

              <LoginForm />
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
