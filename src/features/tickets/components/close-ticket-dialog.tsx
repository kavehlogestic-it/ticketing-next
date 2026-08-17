"use client";

import { CheckCircle2, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Spinner } from "@/components/common/spinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { closeTicketAction } from "@/features/tickets/actions/close-ticket-action";

interface CloseTicketDialogProps {
  ticketId: number;
}

export function CloseTicketDialog({ ticketId }: CloseTicketDialogProps) {
  const t = useTranslations("tickets.dialogs");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCloseTicket = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await closeTicketAction(ticketId);
      if (res.success) {
        setOpen(false);
      } else {
        setError(res.error || "خطا در بستن تیکت");
      }
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs border-destructive/30 text-destructive hover:bg-destructive/10">
          <Lock className="h-3.5 w-3.5" />
          <span>{t("closeTitle")}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("closeTitle")}</DialogTitle>
          <DialogDescription>{t("closeDesc")}</DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            {tCommon("actions.cancel")}
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={handleCloseTicket}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Spinner className="h-4 w-4" />
                <span>{t("closing")}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>{t("confirmClose")}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
