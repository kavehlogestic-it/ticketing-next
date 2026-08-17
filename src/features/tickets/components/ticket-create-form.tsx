"use client";

import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import { useActionState, useEffect } from "react";

import { Spinner } from "@/components/common/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type ActionResult, createTicketAction } from "@/features/tickets/actions/create-ticket-action";
import { TicketFilePicker } from "@/features/tickets/components/form/ticket-file-picker";
import { TicketGroupSelect } from "@/features/tickets/components/form/ticket-group-select";
import { useRouter } from "@/i18n/navigation";
import type { TicketGroup, UserGroup } from "@/types/ticket";

interface TicketCreateFormProps {
  ticketGroups: TicketGroup[];
  userGroups?: UserGroup[];
}

const initialState: ActionResult = { success: false };

export function TicketCreateForm({ ticketGroups }: TicketCreateFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createTicketAction, initialState);

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        router.push("/tickets");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-6">
      {/* Category Group Selector */}
      <TicketGroupSelect ticketGroups={ticketGroups} disabled={isPending} />

      {/* Subject */}
      <div className="space-y-2">
        <Label htmlFor="TicketSubject" className="text-sm font-semibold">
          موضوع تیکت <span className="text-destructive">*</span>
        </Label>
        <Input
          id="TicketSubject"
          name="TicketSubject"
          type="text"
          required
          placeholder="عنوان خلاصه مشکل یا درخواست..."
          disabled={isPending}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="TicketDescription" className="text-sm font-semibold">
          شرح کامل تیکت <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="TicketDescription"
          name="TicketDescription"
          rows={6}
          required
          placeholder="شرح دقیق مشکل، مراحل بروز خطا، و توضیحات تکمیلی..."
          className="resize-y"
          disabled={isPending}
        />
      </div>

      {/* Attachment Upload */}
      <TicketFilePicker disabled={isPending} />

      {/* State Feedback */}
      {state.error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      {state.success ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>تیکت با موفقیت ثبت شد! در حال انتقال به لیست تیکت‌ها...</span>
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          انصراف
        </Button>

        <Button type="submit" disabled={isPending} className="gap-2 shadow-xs">
          {isPending ? (
            <>
              <Spinner className="h-4 w-4" />
              <span>در حال ثبت تیکت...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>ثبت نهایی تیکت</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
