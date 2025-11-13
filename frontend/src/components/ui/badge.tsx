import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "level1" | "level2" | "level3" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center gap-1 rounded-full border font-bold";

    const variants = {
      default: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700",
      level1: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700",
      level2: "bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700",
      level3: "bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 border-violet-300 dark:border-violet-700",
      success: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
      warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700",
      error: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700",
      info: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700",
    };

    const sizes = {
      sm: "px-2 py-0.5 text-[11px]",
      md: "px-2.5 py-0.5 text-xs",
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export default Badge;

