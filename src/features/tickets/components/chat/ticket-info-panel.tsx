"use client";

import { ChangeStatusDialog } from "@/features/tickets/components/change-status-dialog";
import { TicketMetaDetails } from "@/features/tickets/components/chat/ticket-meta-details";
import { TicketParticipants } from "@/features/tickets/components/chat/ticket-participants";
import { CloseTicketDialog } from "@/features/tickets/components/close-ticket-dialog";
import { TicketRating } from "@/features/tickets/components/ticket-rating";
import type { TicketDetail } from "@/types/ticket";

interface TicketInfoPanelProps {
  ticket: TicketDetail;
  showChangeStatus: boolean;
  showClose: boolean;
  showRating: boolean;
}

export function TicketInfoPanel({
  ticket,
  showChangeStatus,
  showClose,
  showRating,
}: TicketInfoPanelProps) {
  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0 overflow-y-auto">
      <div className="p-5 space-y-6">
        {/* Actions bar if permitted */}
        {(showChangeStatus || showClose) && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              عملیات تیکت
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {showChangeStatus && (
                <ChangeStatusDialog
                  ticketId={ticket.ticketId}
                  currentStatus={ticket.ticketStatus}
                />
              )}
              {showClose && (
                <CloseTicketDialog ticketId={ticket.ticketId} />
              )}
            </div>
          </div>
        )}

        {/* Rating card if eligible */}
        {showRating && (
          <div className="pt-2 border-t">
            <TicketRating ticketId={ticket.ticketId} />
          </div>
        )}

        {/* Ticket Details Info */}
        <TicketMetaDetails ticket={ticket} />

        {/* Participants */}
        <TicketParticipants issuerName={ticket.accountFullName} />
      </div>
    </div>
  );
}
