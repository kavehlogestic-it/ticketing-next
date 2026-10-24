"use client";

import { AlertCircle, Paperclip, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ChangeEvent, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatFileSize, MAX_ATTACHMENT_SIZE, MAX_ATTACHMENT_SIZE_MB } from "@/utils/attachment";

interface TicketFilePickerProps {
  disabled?: boolean;
  onErrorChange?: (hasError: boolean) => void;
}

export function TicketFilePicker({ disabled = false, onErrorChange }: TicketFilePickerProps) {
  const t = useTranslations("tickets.create");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    onErrorChange?.(false);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
      const formattedSize = formatFileSize(file.size);
      const errorMsg =
        t("fileSizeErrorDetailed", { size: formattedSize }) ||
        `حجم فایل انتخابی (${formattedSize}) بیش از حد مجاز (${MAX_ATTACHMENT_SIZE_MB} مگابایت) است.`;
      setFileError(errorMsg);
      setSelectedFile(null);
      onErrorChange?.(true);
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFileError(null);
    onErrorChange?.(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">
          {t("attachment")}
        </Label>
        <span className="text-[11px] text-muted-foreground">
          حداکثر حجم مجاز: ۵ مگابایت
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          id="attachment"
          name="attachment"
          type="file"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="gap-2 text-xs"
        >
          <Paperclip className="h-3.5 w-3.5" />
          <span>
            {selectedFile
              ? t("changeFile")
              : t("chooseFile")}
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
  );
}
