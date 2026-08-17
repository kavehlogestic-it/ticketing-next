import { Headphones, User as UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface TicketParticipantsProps {
  issuerName?: string;
}

export function TicketParticipants({ issuerName }: TicketParticipantsProps) {
  const t = useTranslations("tickets.meta");

  return (
    <div className="space-y-3 pt-2 border-t">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t("participants")}
      </h3>

      <div className="space-y-2.5">
        {/* Issuer Card */}
        <div className="flex items-center gap-2.5 rounded-lg border border-border/70 p-2.5 bg-muted/20">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground shrink-0">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="truncate">
            <span className="font-medium text-xs text-foreground block truncate">
              {issuerName || t("issuer")}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {t("issuer")}
            </span>
          </div>
        </div>

        {/* Responder Support Team Card */}
        <div className="flex items-center gap-2.5 rounded-lg border border-primary/30 p-2.5 bg-primary/5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
            <Headphones className="h-4 w-4" />
          </div>
          <div className="truncate">
            <span className="font-medium text-xs text-foreground block truncate">
              {t("supportTeam")}
            </span>
            <span className="text-[10px] text-primary">
              {t("responder")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
