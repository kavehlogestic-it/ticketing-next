"use client";

import { Download, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ImageLightboxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  url: string;
}

export function ImageLightboxDialog({
  open,
  onOpenChange,
  fileName,
  url,
}: ImageLightboxDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-2 sm:p-4 bg-card/95 backdrop-blur-md border-border">
        <div className="flex items-center justify-between pb-3 px-2 border-b">
          <DialogTitle className="text-sm font-bold truncate max-w-md">
            {fileName}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
              <a href={url} download={fileName} target="_blank" rel="noreferrer">
                <Download className="h-3.5 w-3.5" />
                <span>دانلود فایل اصلی</span>
              </a>
            </Button>
            <Button asChild size="sm" variant="ghost" className="gap-1.5 text-xs">
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                <span>نمایش در تب جدید</span>
              </a>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center p-2 max-h-[75vh] overflow-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={fileName}
            className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain shadow-md"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
