"use client";

import { ChevronDown, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { AVAILABLE_USER_GROUP_TYPES } from "@/constants/user-groups";
import type { UserGroup } from "@/types/ticket";

interface TicketUserGroupFilterProps {
  userGroups?: UserGroup[];
  currentUserGroupType?: string;
  onUserGroupChange: (userGroupType?: string) => void;
}

export function TicketUserGroupFilter({
  userGroups = [],
  currentUserGroupType = "",
  onUserGroupChange,
}: TicketUserGroupFilterProps) {
  const t = useTranslations("tickets.list");

  // Merge available constant values with fetched user group titles
  const userGroupMap = new Map<number, string>();
  for (const ug of userGroups) {
    userGroupMap.set(ug.userGroupId, ug.userGroupTitle);
  }

  // Ensure all allowed user group types are represented with clean titles
  const options: Array<{ id: number; title: string }> = AVAILABLE_USER_GROUP_TYPES.map((id) => ({
    id,
    title: userGroupMap.get(id) || `گروه کاربری ${id}`,
  }));

  // Also include any other user groups from backend that might not be in the constant list
  for (const ug of userGroups) {
    if (!options.some((opt) => opt.id === ug.userGroupId)) {
      options.push({ id: ug.userGroupId, title: ug.userGroupTitle });
    }
  }

  return (
    <div className="relative inline-flex items-center min-w-[180px] sm:min-w-[220px]">
      <div className="pointer-events-none absolute start-3.5 flex items-center text-muted-foreground">
        <Users className="h-4 w-4" />
      </div>
      <select
        value={currentUserGroupType}
        onChange={(e) => onUserGroupChange(e.target.value || undefined)}
        aria-label={t("userGroupFilter")}
        className="h-10 w-full appearance-none rounded-xl border border-border bg-background ps-10 pe-10 text-xs font-medium text-foreground transition-colors hover:border-primary/50 focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary shadow-2xs"
      >
        <option value="">{t("allUserGroups")}</option>
        {options.map((opt) => (
          <option key={opt.id} value={String(opt.id)}>
            {opt.title}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute end-3.5 flex items-center text-muted-foreground">
        <ChevronDown className="h-4 w-4 opacity-70" />
      </div>
    </div>
  );
}
