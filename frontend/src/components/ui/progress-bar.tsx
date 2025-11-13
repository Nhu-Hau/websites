import React from "react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0-100
  max?: number;
  variant?: "default" | "success" | "warning" | "error" | "info";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      value,
      max = 100,
      variant = "default",
      showLabel = false,
      size = "md",
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    // Auto-detect variant based on value if variant is "default"
    const getVariant = () => {
      if (variant !== "default") return variant;
      if (percentage >= 80) return "success";
      if (percentage >= 60) return "info";
      if (percentage >= 40) return "warning";
      return "error";
    };

    const actualVariant = getVariant();

    const variantColors = {
      success: "bg-emerald-500",
      warning: "bg-amber-500",
      error: "bg-red-500",
      info: "bg-sky-500",
      default: "bg-zinc-400",
    };

    const sizes = {
      sm: "h-1",
      md: "h-1.5",
      lg: "h-2",
    };

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {showLabel && (
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-zinc-600 dark:text-zinc-400">Tiến độ</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        <div
          className={cn(
            "w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden",
            sizes[size]
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              variantColors[actualVariant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";

export default ProgressBar;

