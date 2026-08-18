import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const NativeSelect = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          className={cn(
            "flex h-10 w-full appearance-none items-center justify-between rounded-xl border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-2xs",
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3.5 text-muted-foreground">
          <ChevronDown className="h-4 w-4 opacity-70" />
        </div>
      </div>
    );
  },
);
NativeSelect.displayName = "NativeSelect";

export { NativeSelect as Select };
