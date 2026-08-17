import { ArrowRight, PlusCircle } from "lucide-react";
import { getLocale } from "next-intl/server";
import { Suspense } from "react";

import NewTicketLoading from "@/app/[locale]/tickets/new/loading";
import { getCachedTicketGroups } from "@/cache";
import { AppFooter } from "@/components/layout/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketCreateForm } from "@/features/tickets/components/ticket-create-form";
import { Link, redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccessToken } from "@/lib/auth/token-store";

async function NewTicketContent() {
  const locale = await getLocale();
  const user = await getCurrentUser();
  const token = await getAccessToken();

  if (!user) {
    redirect({ href: "/", locale });
  }

  let ticketGroups: Array<{ ticketGroupId: number; ticketGroupTitle: string }> = [];
  try {
    ticketGroups = await getCachedTicketGroups(token);
  } catch (error) {
    console.error("Failed to load ticket groups:", error);
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Link href="/tickets">
            <ArrowRight className="h-3.5 w-3.5" />
            <span>بازگشت به لیست تیکت‌ها</span>
          </Link>
        </Button>
      </div>

      <Card className="shadow-md border-border/80">
        <CardHeader className="space-y-1.5 pb-6 border-b">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">
                ثبت تیکت پشتیبانی جدید
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                اطلاعات درخواست یا مشکل خود را با دقت ثبت نمایید تا توسط کارشناسان بررسی شود.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <TicketCreateForm ticketGroups={ticketGroups} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewTicketPage() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-between">
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Suspense fallback={<NewTicketLoading />}>
          <NewTicketContent />
        </Suspense>
      </main>
      <AppFooter />
    </div>
  );
}
