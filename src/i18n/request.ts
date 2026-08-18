import { getRequestConfig } from "next-intl/server";

import authEn from "@/messages/en/auth.json";
import commonEn from "@/messages/en/common.json";
import dashboardEn from "@/messages/en/dashboard.json";
import homeEn from "@/messages/en/home.json";
import metadataEn from "@/messages/en/metadata.json";
import ticketsEn from "@/messages/en/tickets.json";
import validationEn from "@/messages/en/validation.json";
import authFa from "@/messages/fa/auth.json";
import commonFa from "@/messages/fa/common.json";
import dashboardFa from "@/messages/fa/dashboard.json";
import homeFa from "@/messages/fa/home.json";
import metadataFa from "@/messages/fa/metadata.json";
import ticketsFa from "@/messages/fa/tickets.json";
import validationFa from "@/messages/fa/validation.json";

const messagesMap = {
  fa: {
    common: commonFa,
    auth: authFa,
    dashboard: dashboardFa,
    tickets: ticketsFa,
    validation: validationFa,
    home: homeFa,
    metadata: metadataFa,
  },
  en: {
    common: commonEn,
    auth: authEn,
    dashboard: dashboardEn,
    tickets: ticketsEn,
    validation: validationEn,
    home: homeEn,
    metadata: metadataEn,
  },
} as const;

export function getStaticMessages(locale: string) {
  return messagesMap[locale as keyof typeof messagesMap] || messagesMap.fa;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested === "en" || requested === "fa" ? requested : "fa";

  return {
    locale,
    messages: getStaticMessages(locale),
  };
});
