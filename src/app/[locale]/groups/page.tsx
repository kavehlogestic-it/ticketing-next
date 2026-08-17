import { FolderTree, Users } from "lucide-react";
import { getLocale } from "next-intl/server";
import { Suspense } from "react";

import GroupsLoading from "@/app/[locale]/groups/loading";
import { getCachedTicketGroups, getCachedUserGroups } from "@/cache";
import { AppFooter } from "@/components/layout/app-footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccessToken } from "@/lib/auth/token-store";

async function GroupsContent() {
  const locale = await getLocale();
  const user = await getCurrentUser();
  const token = await getAccessToken();

  if (!user) {
    redirect({ href: "/", locale });
    return null;
  }

  let userGroups: Array<{ userGroupId: number; userGroupTitle: string }> = [];
  let ticketGroups: Array<{ ticketGroupId: number; ticketGroupTitle: string }> = [];

  try {
    const [ug, tg] = await Promise.all([
      getCachedUserGroups(token),
      getCachedTicketGroups(token),
    ]);
    userGroups = ug;
    ticketGroups = tg;
  } catch (error) {
    console.error("Failed to load groups:", error);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          مدیریت و مشاهده گروه‌ها
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          نمایش گروه‌های کاربری فعال در سازمان و دسته‌بندی موضوعی تیکت‌ها
        </p>
      </div>

      {/* Current User Group Context */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-foreground text-sm">
              گروه کاربری اختصاصی شما
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              کاربر «{user.fullName || user.username}» به شناسه گروه {user.userGroupId} متصل است.
            </p>
          </div>
          <Badge variant="default" className="text-xs font-mono">
            GroupID: {user.userGroupId}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* User Groups Card */}
        <Card className="shadow-2xs">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-bold">
                گروه‌های کاربری سازمان
              </CardTitle>
            </div>
            <CardDescription>
              تعداد کل گروه‌های کاربری: {userGroups.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="divide-y divide-border/60 max-h-[400px] overflow-y-auto pr-2">
              {userGroups.map((g) => {
                const isMyGroup = g.userGroupId === user.userGroupId;
                return (
                  <div
                    key={g.userGroupId}
                    className={`flex items-center justify-between py-2.5 px-2 rounded-md ${
                      isMyGroup ? "bg-primary/10 font-semibold" : "hover:bg-muted/40"
                    }`}
                  >
                    <span className="text-sm text-foreground">{g.userGroupTitle}</span>
                    <div className="flex items-center gap-2">
                      {isMyGroup && (
                        <Badge variant="default" className="text-[10px]">
                          گروه شما
                        </Badge>
                      )}
                      <span className="font-mono text-xs text-muted-foreground">
                        ID: {g.userGroupId}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Ticket Categories Card */}
        <Card className="shadow-2xs">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-2">
              <FolderTree className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-bold">
                دسته‌بندی‌های تیکت
              </CardTitle>
            </div>
            <CardDescription>
              دسته‌های مجاز جهت ثبت درخواست: {ticketGroups.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="divide-y divide-border/60 max-h-[400px] overflow-y-auto pr-2">
              {ticketGroups.map((tg) => (
                <div
                  key={tg.ticketGroupId}
                  className="flex items-center justify-between py-2.5 px-2 rounded-md hover:bg-muted/40"
                >
                  <span className="text-sm text-foreground">{tg.ticketGroupTitle}</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    ID: {tg.ticketGroupId}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function GroupsPage() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-between">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Suspense fallback={<GroupsLoading />}>
          <GroupsContent />
        </Suspense>
      </main>
      <AppFooter />
    </div>
  );
}
