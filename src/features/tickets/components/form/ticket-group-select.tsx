import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { TicketGroup } from "@/types/ticket";

interface TicketGroupSelectProps {
  ticketGroups: TicketGroup[];
  disabled?: boolean;
}

export function TicketGroupSelect({
  ticketGroups,
  disabled = false,
}: TicketGroupSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="TicketGroupId" className="text-sm font-semibold">
        دسته‌بندی تیکت <span className="text-destructive">*</span>
      </Label>
      <Select id="TicketGroupId" name="TicketGroupId" required disabled={disabled}>
        <option value="">--- انتخاب نوع تیکت ---</option>
        {ticketGroups.map((group) => (
          <option key={group.ticketGroupId} value={group.ticketGroupId}>
            {group.ticketGroupTitle}
          </option>
        ))}
      </Select>
    </div>
  );
}
