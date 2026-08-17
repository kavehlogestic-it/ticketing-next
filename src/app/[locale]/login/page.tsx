import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";

export default async function LoginPage() {
  const locale = await getLocale();
  redirect({ href: "/", locale });
  return null;
}
