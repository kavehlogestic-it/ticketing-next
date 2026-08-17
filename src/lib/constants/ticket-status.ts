export type TicketStatusKey = "open" | "in_progress" | "under_review" | "read" | "closed" | "other";

export interface StatusMeta {
  key: TicketStatusKey;
  labelEn: string;
  labelFa: string;
  variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
}

export const KNOWN_STATUSES: Record<string, StatusMeta> = {
  "در انتظار بررسی": {
    key: "open",
    labelEn: "Pending Review",
    labelFa: "در انتظار بررسی",
    variant: "warning",
    bgClass: "bg-amber-500/10 dark:bg-amber-500/20",
    textClass: "text-amber-700 dark:text-amber-300",
    borderClass: "border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  "در حال بررسی": {
    key: "under_review",
    labelEn: "Under Review",
    labelFa: "در حال بررسی",
    variant: "info",
    bgClass: "bg-blue-500/10 dark:bg-blue-500/20",
    textClass: "text-blue-700 dark:text-blue-300",
    borderClass: "border-blue-500/30",
    dotClass: "bg-blue-500",
  },
  "در حال انجام": {
    key: "in_progress",
    labelEn: "In Progress",
    labelFa: "در حال انجام",
    variant: "secondary",
    bgClass: "bg-purple-500/10 dark:bg-purple-500/20",
    textClass: "text-purple-700 dark:text-purple-300",
    borderClass: "border-purple-500/30",
    dotClass: "bg-purple-500",
  },
  "خوانده شده": {
    key: "read",
    labelEn: "Read",
    labelFa: "خوانده شده",
    variant: "secondary",
    bgClass: "bg-teal-500/10 dark:bg-teal-500/20",
    textClass: "text-teal-700 dark:text-teal-300",
    borderClass: "border-teal-500/30",
    dotClass: "bg-teal-500",
  },
  "بسته شده": {
    key: "closed",
    labelEn: "Closed",
    labelFa: "بسته شده",
    variant: "outline",
    bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20",
    textClass: "text-emerald-700 dark:text-emerald-300",
    borderClass: "border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
};

export const DEFAULT_STATUS_META: StatusMeta = {
  key: "other",
  labelEn: "Active",
  labelFa: "نامشخص",
  variant: "default",
  bgClass: "bg-muted",
  textClass: "text-muted-foreground",
  borderClass: "border-border",
  dotClass: "bg-muted-foreground",
};

export function getStatusMeta(status: string | null | undefined): StatusMeta {
  if (!status) return DEFAULT_STATUS_META;
  const trimmed = status.trim();
  const directMatch = KNOWN_STATUSES[trimmed];
  if (directMatch) {
    return directMatch;
  }
  // Try case-insensitive English matches
  const lower = trimmed.toLowerCase();
  if (lower.includes("close") || lower.includes("بسته")) return KNOWN_STATUSES["بسته شده"] ?? DEFAULT_STATUS_META;
  if (lower.includes("progress") || lower.includes("انجام")) return KNOWN_STATUSES["در حال انجام"] ?? DEFAULT_STATUS_META;
  if (lower.includes("review") || lower.includes("بررسی")) return KNOWN_STATUSES["در حال بررسی"] ?? DEFAULT_STATUS_META;
  if (lower.includes("open") || lower.includes("انتظار")) return KNOWN_STATUSES["در انتظار بررسی"] ?? DEFAULT_STATUS_META;
  if (lower.includes("read") || lower.includes("خوانده")) return KNOWN_STATUSES["خوانده شده"] ?? DEFAULT_STATUS_META;

  return {
    ...DEFAULT_STATUS_META,
    labelFa: trimmed,
    labelEn: trimmed,
  };
}

export function isClosedStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const meta = getStatusMeta(status);
  return meta.key === "closed";
}

export const RESPONDER_STATUS_OPTIONS = [
  { value: "در انتظار بررسی", labelFa: "در انتظار بررسی", labelEn: "Pending Review" },
  { value: "در حال بررسی", labelFa: "در حال بررسی", labelEn: "Under Review" },
  { value: "در حال انجام", labelFa: "در حال انجام", labelEn: "In Progress" },
  { value: "خوانده شده", labelFa: "خوانده شده", labelEn: "Read" },
  { value: "بسته شده", labelFa: "بسته شده", labelEn: "Closed" },
];
