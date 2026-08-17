"use client";

import { AlertCircle, Paperclip, X } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface TicketFilePickerProps {
  disabled?: boolean;
}

export function TicketFilePicker({ disabled = false }: TicketFilePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const MAX_SIZE = 15 * 1024 * 1024; // 15MB
    if (file.size > MAX_SIZE) {
      setFileError("حجم فایل نباید بیش از ۱۵ مگابایت باشد");
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

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">فایل پیوست (اختیاری)</Label>
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
              ? "تغییر فایل انتخابی"
              : "انتخاب فایل (عکس، PDF، اکسل و...)"}
          </span>
        </Button>

        {selectedFile ? (
          <div className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs font-mono text-foreground">
            <span className="truncate max-w-[200px]">{selectedFile.name}</span>
            <span className="text-muted-foreground text-[11px]">
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
            <button
              type="button"
              onClick={removeSelectedFile}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      {fileError ? (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{fileError}</span>
        </p>
      ) : null}
    </div>
  );
}
