"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ChipItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
}

interface HorizontalChipNavProps {
  items: ChipItem[];
  activeId: string;
  onItemClick?: (id: string) => void;
  className?: string;
}

export default function HorizontalChipNav({
  items,
  activeId,
  onItemClick,
  className,
}: HorizontalChipNavProps) {
  return (
    <div
      className={cn(
        "lg:hidden sticky top-14 z-30",
        "bg-white/95 dark:bg-zinc-950/95",
        "backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800/80",
        "shadow-sm",
        className
      )}
    >
      <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center gap-2 px-4 py-3 min-w-max">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  } else if (onItemClick) {
                    onItemClick(item.id);
                  }
                }}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                  "text-sm font-medium whitespace-nowrap",
                  "transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2",
                  isActive
                    ? "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 shadow-sm ring-1 ring-sky-200 dark:ring-sky-800"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive
                        ? "text-sky-600 dark:text-sky-400"
                        : "text-zinc-500 dark:text-zinc-400"
                    )}
                  />
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
