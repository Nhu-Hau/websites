import React from "react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  (
    {
      className,
      title,
      description,
      icon,
      actions,
      size = "md",
      ...props
    },
    ref
  ) => {
    const sizes = {
      sm: "text-base",
      md: "text-lg",
      lg: "text-xl",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2 sm:gap-2.5">
          {icon && (
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex-shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h2
              className={cn(
                "font-bold text-zinc-900 dark:text-white",
                sizes[size]
              )}
            >
              {title}
            </h2>
            {description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        )}
      </div>
    );
  }
);

SectionHeader.displayName = "SectionHeader";

export default SectionHeader;

