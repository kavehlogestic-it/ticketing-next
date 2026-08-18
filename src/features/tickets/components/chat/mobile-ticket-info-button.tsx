"use client";

import { Info } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TicketInfoPanel } from "@/features/tickets/components/chat/ticket-info-panel";
import type { TicketDetail } from "@/types/ticket";

interface MobileTicketInfoButtonProps {
  ticket: TicketDetail;
  showChangeStatus: boolean;
  showClose: boolean;
  showRating: boolean;
}

export function MobileTicketInfoButton({
  ticket,
  showChangeStatus,
  showClose,
  showRating,
}: MobileTicketInfoButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 px-2.5 gap-1.5 text-xs lg:hidden rounded-lg"
        title="مشاهده مشخصات تیکت"
      >
        <Info className="h-3.5 w-3.5 text-primary" />
        <span className="hidden sm:inline">مشخصات</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-card rounded-2xl" dir="rtl">
          <DialogHeader className="p-4 border-b text-right">
            <DialogTitle className="text-sm font-bold text-foreground">
              مشخصات و جزئیات تیکت #{ticket.ticketId}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[75dvh] overflow-y-auto">
            <TicketInfoPanel
              ticket={ticket}
              showChangeStatus={showChangeStatus}
              showClose={showClose}
              showRating={showRating}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
