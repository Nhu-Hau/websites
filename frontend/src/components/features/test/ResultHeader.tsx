"use client";

import React from "react";
import { ListChecks, Timer } from "lucide-react";

export type ResultHeaderProps = {
  badge: {
    label: string;
    dotColor?: string;
  };
  title: string;
  description: React.ReactNode;
  stats?: {
    correct: number;
    total: number;
    timeLabel: string; // e.g., "5:23"
    questionIconColor?: string;
    timeIconColor?: string;
  };
};

export function ResultHeader({
  badge,
  title,
  description,
  stats,
}: ResultHeaderProps) {
  return (
    <header className="mb-6 sm:mb-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-700 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-300">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                badge.dotColor || "bg-emerald-500"
              }`}
            />
            {badge.label}
          </p>
          <h1 className="text-2xl xs:text-[1.7rem] sm:text-3xl md:text-[2.1rem] font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
            {title}
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            {description}
          </p>
        </div>

        {stats && (
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {/* Card số câu đúng */}
            <div className="group flex items-center gap-2.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/90 px-4 py-3 text-sm shadow-sm backdrop-blur-sm">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  stats.questionIconColor ||
                  "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300"
                }`}
              >
                <ListChecks className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                  Số câu đúng
                </p>
                <p className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50">
                  {stats.correct}/{stats.total}
                </p>
              </div>
            </div>

            {/* Card thời gian */}
            <div className="group flex items-center gap-2.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/90 px-4 py-3 text-sm shadow-sm backdrop-blur-sm">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  stats.timeIconColor ||
                  "bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300"
                }`}
              >
                <Timer className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                  Thời gian
                </p>
                <p className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50">
                  {stats.timeLabel}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

