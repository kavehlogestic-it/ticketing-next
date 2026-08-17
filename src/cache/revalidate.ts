import { revalidatePath } from "next/cache";

/**
 * Revalidates cache after ticket creation, update, reply, status change, or closure.
 */
export function revalidateTicket(ticketId?: string | number) {
  if (ticketId) {
    revalidatePath(`/[locale]/tickets/${ticketId}`, "page");
  }
  revalidatePath("/[locale]/tickets", "page");
  revalidatePath("/[locale]/dashboard", "page");
}

/**
 * Revalidates groups cache across pages.
 */
export function revalidateGroups() {
  revalidatePath("/[locale]/groups", "page");
  revalidatePath("/[locale]/tickets/new", "page");
}

/**
 * Revalidates all dashboard data.
 */
export function revalidateDashboard() {
  revalidatePath("/[locale]/dashboard", "page");
}
