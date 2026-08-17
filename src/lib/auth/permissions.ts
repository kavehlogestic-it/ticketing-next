import { isClosedStatus } from "@/lib/constants/ticket-status";
import type { TicketDetail, TicketSummary, User } from "@/types/ticket";

/**
 * Centralized role and authorization helpers.
 * Never scatter raw checks like `user.roleTypeId === 1` throughout the UI.
 */

export function isResponder(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.roleId === 1 || user.roleName?.toLowerCase() === "admin";
}

export function isTicketIssuer(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.roleId !== 1 && user.roleName?.toLowerCase() !== "admin";
}

export function canRespondToTicket(
  user: User | null | undefined,
  ticket?: TicketSummary | TicketDetail | null,
): boolean {
  if (!user) return false;
  if (ticket && isClosedStatus(ticket.ticketStatus)) {
    return false;
  }
  return true;
}

export function canCloseTicket(
  user: User | null | undefined,
  ticket?: TicketSummary | TicketDetail | null,
): boolean {
  if (!user) return false;
  if (!ticket) return false;
  if (isClosedStatus(ticket.ticketStatus)) return false;
  // Responders can always close, issuers can close their own active tickets
  return isResponder(user) || isTicketIssuer(user);
}

export function canChangeTicketStatus(user: User | null | undefined): boolean {
  return isResponder(user);
}

export function canRateTicket(
  user: User | null | undefined,
  ticket: TicketSummary | TicketDetail | null | undefined,
  hasExistingRating = false,
): boolean {
  if (!user || !ticket) return false;
  // Only normal users (issuers) can rate
  if (!isTicketIssuer(user)) return false;
  // Ticket must be closed
  if (!isClosedStatus(ticket.ticketStatus)) return false;
  // Must not have been rated yet
  if (hasExistingRating) return false;
  return true;
}
