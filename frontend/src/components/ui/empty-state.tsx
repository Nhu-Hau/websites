import React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center p-6",
          className
        )}
        {...props}
      >
        {icon && (
          <div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-2.5">
            {icon}
          </div>
        )}
        <p className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400">
          {title}
        </p>
        {description && (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-1">
            {description}
          </p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";

export default EmptyState;

