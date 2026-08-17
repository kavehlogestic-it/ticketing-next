"use client";

interface StatusOption {
  value: string;
  label: string;
}

const statusOptions: StatusOption[] = [
  { value: "", label: "همه" },
  { value: "در انتظار بررسی", label: "در انتظار بررسی" },
  { value: "در حال بررسی", label: "در حال بررسی" },
  { value: "در حال انجام", label: "در حال انجام" },
  { value: "خوانده شده", label: "خوانده شده" },
  { value: "بسته شده", label: "بسته شده" },
];

interface TicketStatusTabsProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
}

export function TicketStatusTabs({
  currentStatus,
  onStatusChange,
}: TicketStatusTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
      {statusOptions.map((opt) => {
        const isActive = (currentStatus || "") === opt.value;
        return (
          <button
            key={opt.value || "all"}
            type="button"
            onClick={() => onStatusChange(opt.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              isActive
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
