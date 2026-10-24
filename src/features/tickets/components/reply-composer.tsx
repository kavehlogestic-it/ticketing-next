"use client";

import { AlertCircle, CheckCircle2, Paperclip, Send, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ChangeEvent, type FormEvent, useActionState, useEffect, useRef, useState } from "react";

import { Spinner } from "@/components/common/spinner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type ActionResult, replyTicketAction } from "@/features/tickets/actions/reply-ticket-action";
import { formatFileSize, MAX_ATTACHMENT_SIZE, MAX_ATTACHMENT_SIZE_MB } from "@/utils/attachment";

interface ReplyComposerProps {
  ticketId: number;
  disabled?: boolean;
}

const initialState: ActionResult = { success: false };

export function ReplyComposer({ ticketId, disabled = false }: ReplyComposerProps) {
  const t = useTranslations("tickets.chat");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const boundAction = replyTicketAction.bind(null, ticketId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);
  const isSubmittingRef = useRef(false);

  // Clear input on success and release submit lock
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setSelectedFile(null);
      setFileError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    isSubmittingRef.current = false;
  }, [state.success, state.error]);

  const isLocked = isPending || isSubmittingRef.current;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (isSubmittingRef.current || isPending || Boolean(fileError)) {
      e.preventDefault();
      return;
    }
    isSubmittingRef.current = true;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
      const formattedSize = formatFileSize(file.size);
      const errorMsg =
        t("fileSizeErrorDetailed", { size: formattedSize }) ||
        t("fileTooLarge", { maxSize: "5MB" }) ||
        `حجم فایل انتخابی (${formattedSize}) بیش از حد مجاز (${MAX_ATTACHMENT_SIZE_MB} مگابایت) است.`;
      setFileError(errorMsg);
      setSelectedFile(null);
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (disabled) {
    return (
      <div className="rounded-xl border border-border/80 bg-muted/30 p-5 text-center text-sm text-muted-foreground">
        {t("ticketClosedNotice")}
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-5 shadow-2xs">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        {t("sendReply")}
      </h3>

      <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Textarea
            name="Text"
            rows={4}
            required
            placeholder={t("replyPlaceholder")}
            className="resize-y"
            disabled={isLocked}
          />
        </div>

        {/* Attachment selection & preview */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              id="attachment"
              name="attachment"
              type="file"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLocked}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLocked}
              className="gap-2 text-xs"
            >
              <Paperclip className="h-3.5 w-3.5" />
              <span>
                {selectedFile ? t("changeFile") : t("attachFile")} (حداکثر ۵ مگابایت)
              </span>
            </Button>

            {selectedFile ? (
              <div className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs font-mono text-foreground">
                <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                <span className="text-muted-foreground text-[11px]">
                  ({formatFileSize(selectedFile.size)})
                </span>
                <button
                  type="button"
                  onClick={removeSelectedFile}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  title="حذف فایل"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
          </div>

          {fileError ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive font-medium animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          ) : null}
        </div>

        {/* State feedback */}
        {state.error ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        ) : null}

        {state.success ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{t("sendReply")}</span>
          </div>
        ) : null}

        {/* Submit button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isLocked} className="gap-2 shadow-xs">
            {isLocked ? (
              <>
                <Spinner className="h-4 w-4" />
                <span>{t("sendingReply")}</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>{t("sendReply")}</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
