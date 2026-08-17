"use server";

import { getUserLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { logoutApi } from "@/services/auth-service";

export async function logoutAction(): Promise<void> {
  await logoutApi();
  const locale = await getUserLocale();
  redirect({ href: "/", locale });
}
