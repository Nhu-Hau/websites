import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "./card";

export interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  iconBg?: string;
  label: string;
  value: string | number;
  subValue?: string | React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  (
    { className, icon, iconBg, label, value, subValue, trend, ...props },
    ref
  ) => {
    const iconBgClass = iconBg || "bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/20";

    return (
      <Card
        ref={ref}
        variant="stats"
        hover
        className={cn("p-4", className)}
        {...props}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className={cn("p-2.5 rounded-xl", iconBgClass)}>
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {label}
            </p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">
              {value}
              {typeof subValue === "string" && (
                <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-1">
                  {subValue}
                </span>
              )}
            </p>
            {typeof subValue !== "string" && subValue && (
              <div className="mt-1">{subValue}</div>
            )}
          </div>
        </div>
      </Card>
    );
  }
);

StatsCard.displayName = "StatsCard";

export default StatsCard;

