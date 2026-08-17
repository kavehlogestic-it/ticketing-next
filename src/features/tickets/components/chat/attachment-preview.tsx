"use client";

import { Download, Eye, FileSpreadsheet, FileText, Image as ImageIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ImageLightboxDialog } from "@/features/tickets/components/chat/image-lightbox-dialog";
import { getAttachmentUrl, getFileExtension, isImageAttachment } from "@/utils/attachment";

interface AttachmentPreviewProps {
  fileName: string;
  className?: string;
}

export function AttachmentPreview({ fileName, className = "" }: AttachmentPreviewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isImage = isImageAttachment(fileName);
  const ext = getFileExtension(fileName);
  const url = getAttachmentUrl(fileName);

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-4 w-4 text-blue-500" />;
    if (ext === "XLS" || ext === "XLSX" || ext === "CSV") {
      return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />;
    }
    return <FileText className="h-4 w-4 text-primary" />;
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* If Image: Compact thumbnail preview with click-to-view and download */}
      {isImage ? (
        <div className="space-y-1">
          <div className="relative group/image overflow-hidden rounded-lg border border-border/80 bg-background/80 max-w-[200px] sm:max-w-[220px] shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={fileName}
              className="h-28 sm:h-32 w-full object-cover transition-transform duration-300 group-hover/image:scale-105 cursor-pointer"
              onClick={() => setLightboxOpen(true)}
              loading="lazy"
            />

            {/* Hover Action Overlay */}
            <div className="absolute inset-0 bg-background/70 backdrop-blur-2xs opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1.5 pointer-events-none group-hover/image:pointer-events-auto">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setLightboxOpen(true)}
                className="h-7 px-2 text-[11px] gap-1 shadow-sm rounded-md"
              >
                <Eye className="h-3 w-3" />
                <span>نمایش</span>
              </Button>

              <Button
                asChild
                size="sm"
                variant="default"
                className="h-7 px-2 text-[11px] gap-1 shadow-sm rounded-md"
              >
                <a href={url} download={fileName} target="_blank" rel="noreferrer">
                  <Download className="h-3 w-3" />
                  <span>دانلود</span>
                </a>
              </Button>
            </div>
          </div>

          {/* Compact Caption */}
          <div className="flex items-center justify-between gap-1.5 max-w-[200px] sm:max-w-[220px] text-[10px] text-muted-foreground font-mono">
            <span className="truncate max-w-[120px]">{fileName}</span>
            <a
              href={url}
              download={fileName}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 text-primary hover:underline shrink-0"
            >
              <Download className="h-2.5 w-2.5" />
              <span>دانلود</span>
            </a>
          </div>

          {/* Full Resolution Lightbox Modal */}
          <ImageLightboxDialog
            open={lightboxOpen}
            onOpenChange={setLightboxOpen}
            fileName={fileName}
            url={url}
          />
        </div>
      ) : (
        /* If Document / File: Sleek File Card with Direct Download */
        <div className="inline-flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-background/90 p-2.5 sm:p-3 text-xs font-mono max-w-md transition-all hover:border-primary/50 shadow-2xs">
          <div className="flex items-center gap-2.5 truncate">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
              {getFileIcon()}
            </div>
            <div className="flex flex-col truncate">
              <span className="truncate font-semibold text-foreground">{fileName}</span>
              <span className="text-[10px] text-muted-foreground">
                فایل {ext || "ضمیمه"}
              </span>
            </div>
          </div>

          <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs shrink-0 h-8">
            <a href={url} download={fileName} target="_blank" rel="noreferrer">
              <Download className="h-3.5 w-3.5" />
              <span>دانلود</span>
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
