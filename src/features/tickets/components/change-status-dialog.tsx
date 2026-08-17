"use client";

import { Check, RefreshCw } from "lucide-react";
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
import { Select } from "@/components/ui/select";
import { changeStatusAction } from "@/features/tickets/actions/change-status-action";
import { RESPONDER_STATUS_OPTIONS } from "@/lib/constants/ticket-status";

interface ChangeStatusDialogProps {
  ticketId: number;
  currentStatus: string;
}

export function ChangeStatusDialog({
  ticketId,
  currentStatus,
}: ChangeStatusDialogProps) {
  const t = useTranslations("tickets.dialogs");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus || "در حال انجام");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await changeStatusAction(ticketId, status);
      if (res.success) {
        setOpen(false);
      } else {
        setError(res.error || "خطا در تغییر وضعیت تیکت");
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
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>{t("changeStatusTitle")}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("changeStatusTitle")}</DialogTitle>
          <DialogDescription>{t("changeStatusDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">
              {t("selectStatus")}
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
            >
              {RESPONDER_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.labelFa}
                </option>
              ))}
            </Select>
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          ) : null}
        </div>

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
            onClick={handleSubmit}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Spinner className="h-4 w-4" />
                <span>{t("savingStatus")}</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>{t("saveStatus")}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
