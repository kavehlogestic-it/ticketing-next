"use client";

import { AlertCircle, Lock, Paperclip, Send, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ChangeEvent, type FormEvent, useRef, useState, useTransition } from "react";

import { Spinner } from "@/components/common/spinner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { replyTicketAction } from "@/features/tickets/actions/reply-ticket-action";

interface ChatComposerProps {
  ticketId: number;
  disabled?: boolean;
  onOptimisticSend?: (text: string, attachmentName?: string | null) => number | void;
  onSendSuccess?: (optimisticId: number) => void;
  onSendError?: (optimisticId: number) => void;
}

// NOTE: add `fileTooLarge` (with a `{maxSize}` param) and `sendError` keys
// to the `tickets.chat` translation namespace if they don't exist yet.
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export function ChatComposer({
  ticketId,
  disabled = false,
  onOptimisticSend,
  onSendSuccess,
  onSendError,
}: ChatComposerProps) {
  const t = useTranslations("tickets.chat");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetFileInput = () => {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError(t("fileTooLarge", { maxSize: "15MB" }));
      setSelectedFile(null);
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  // Shared by both the form's submit event and the Ctrl/Cmd+Enter shortcut,
  // so we never have to pass a mismatched event type into it.
  const submitReply = () => {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    setActionError(null);

    const fileToSend = selectedFile;
    let optId: number | undefined;
    if (onOptimisticSend) {
      const result = onOptimisticSend(trimmed, fileToSend ? fileToSend.name : null);
      if (typeof result === "number") optId = result;
    }

    // Reset input fields right away so the user can start typing the next message.
    setText("");
    resetFileInput();
    textareaRef.current?.focus();

    startTransition(async () => {
      const formData = new FormData();
      formData.append("Text", trimmed);
      if (fileToSend && fileToSend.size > 0) {
        formData.append("attachment", fileToSend);
      }

      const res = await replyTicketAction(ticketId, { success: false }, formData);

      if (!res.success) {
        setActionError(res.error || t("sendError"));
        // Restore what the user typed/attached so a failed send doesn't lose their message.
        setText(trimmed);
        setSelectedFile(fileToSend ?? null);
        if (typeof optId === "number") {
          onSendError?.(optId);
        }
      } else if (typeof optId === "number") {
        onSendSuccess?.(optId);
      }
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitReply();
  };

  if (disabled) {
    return (
      <div className="border-t bg-muted/40 p-4 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          <span>{t("ticketClosedNotice")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t bg-card p-3 sm:p-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-sm z-10">
      <form onSubmit={handleSubmit} className="space-y-2.5">
        {/* Selected Attachment Chip Preview */}
        {selectedFile ? (
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 py-1 text-xs font-mono">
            <Paperclip className="h-3.5 w-3.5 text-primary" />
            <span className="truncate max-w-[220px] font-medium text-foreground">{selectedFile.name}</span>
            <span className="text-muted-foreground text-[10px]">
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
            <button
              type="button"
              onClick={resetFileInput}
              className="text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded-sm"
              title={t("removeFile")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        {fileError ? (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{fileError}</span>
          </p>
        ) : null}

        {/* Input Bar */}
        <div className="flex items-end gap-2">
          {/* File input button */}
          <input
            ref={fileInputRef}
            id="attachment"
            name="attachment"
            type="file"
            onChange={handleFileChange}
            className="hidden"
            disabled={isPending}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
            title={t("attachFile")}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Text input area */}
          <div className="flex-1 min-w-0">
            <Textarea
              ref={textareaRef}
              name="Text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              required
              placeholder={t("replyPlaceholder")}
              className="min-h-[44px] max-h-[140px] resize-none py-2 text-sm bg-background border-border/80 focus-visible:ring-1 focus-visible:ring-primary"
              disabled={isPending}
              onKeyDown={(e) => {
                // Submit on Ctrl+Enter or Cmd+Enter
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  submitReply();
                }
              }}
            />
          </div>

          {/* Send Button */}
          <Button
            type="submit"
            size="icon"
            disabled={isPending || !text.trim()}
            className="h-10 w-10 shrink-0 rounded-xl shadow-xs"
            title={t("sendReply")}
          >
            {isPending ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        {/* Error message */}
        {actionError ? (
          <div className="flex items-center gap-1.5 text-xs text-destructive pt-1">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{actionError}</span>
          </div>
        ) : null}
      </form>
    </div>
  );
}