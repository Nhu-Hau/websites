"use client";

import React from "react";
import { Timer, Clock, Focus as FocusIcon, Send, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export type FocusHUDProps = {
  /** trạng thái */
  started: boolean;
  resp: unknown | null;
  focusMode: boolean;

  /** dữ liệu hiển thị */
  durationMin: number;
  total: number;
  currentIndex: number; // 0-based
  leftSec: number; // giây còn lại (đếm ngược)
  progressPercent: number; // 0..100

  /** hành động */
  onStart: () => void;
  onSubmit: () => void;
  onOpenQuickNav: () => void; // mở bottom sheet điều hướng nhanh (mobile)
};

function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * FocusHUD: gộp 3 khối UI lặp lại:
 *  - Mobile HUD (chưa bắt đầu)  lg:hidden
 *  - Mobile HUD (đang làm)      lg:hidden
 *  - Desktop Focus Mode HUD     hidden lg:flex (khi focusMode === true)
 */
export default function FocusHUD({
  started,
  resp,
  focusMode,
  durationMin,
  total,
  currentIndex,
  leftSec,
  progressPercent,
  onStart,
  onSubmit,
  onOpenQuickNav,
}: FocusHUDProps) {
  const showMobile = !resp;
  const showDesktopFocus = focusMode && !resp;

  // Shared styles for HUD container
  const hudContainerBase = cn(
    "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
    "w-[calc(100%-2rem)] max-w-xl",
    "rounded-2xl",
    "bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl",
    "border border-zinc-200 dark:border-zinc-700",
    "shadow-lg"
  );

  // Shared styles for button primary
  const buttonPrimary = cn(
    "inline-flex items-center justify-center gap-2",
    "px-4 py-2.5 rounded-xl",
    "bg-gradient-to-r from-emerald-600 to-emerald-500",
    "hover:from-emerald-500 hover:to-emerald-400",
    "text-white font-semibold text-sm",
    "transition-all duration-200",
    "hover:shadow-md active:scale-[0.98]"
  );

  // Shared styles for button secondary
  const buttonSecondary = cn(
    "inline-flex items-center justify-center gap-2",
    "px-4 py-2.5 rounded-xl",
    "bg-zinc-900 hover:bg-zinc-800",
    "text-white font-semibold text-sm",
    "transition-all duration-200",
    "hover:shadow-md active:scale-[0.98]"
  );

  return (
    <>
      {/* Mobile HUD - Chưa bắt đầu */}
      {showMobile && !started && (
        <div className={cn(hudContainerBase, "lg:hidden")}>
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-center gap-3 text-sm font-medium">
              <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                {durationMin} phút
              </span>
              <span className="text-zinc-400 dark:text-zinc-500">•</span>
              <span className="text-zinc-700 dark:text-zinc-300">
                {total} câu
              </span>
            </div>
            <button onClick={onStart} className={buttonPrimary}>
              <Play className="w-4 h-4" />
              Bắt đầu
            </button>
          </div>
        </div>
      )}

      {/* Mobile HUD - Đang làm */}
      {showMobile && started && (
        <div className={cn(hudContainerBase, "lg:hidden")}>
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200 min-w-0 flex-1">
              <span className="whitespace-nowrap">
                Câu{" "}
                <span className="px-1.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold">
                  {currentIndex + 1}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">/{total}</span>
              </span>
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400 whitespace-nowrap">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {fmtTime(leftSec)}
              </span>
              <div className="hidden xs:block w-20 sm:w-32 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={onOpenQuickNav}
                className={cn(
                  "hidden sm:flex items-center justify-center gap-1.5",
                  "px-3 py-1.5 rounded-xl",
                  "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700",
                  "text-zinc-800 dark:text-zinc-100",
                  "transition-all duration-200 hover:scale-105 active:scale-100"
                )}
                aria-label="Điều hướng nhanh"
              >
                <FocusIcon className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenQuickNav}
                className={cn(
                  "sm:hidden grid place-items-center",
                  "w-9 h-9 rounded-xl",
                  "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700",
                  "text-zinc-800 dark:text-zinc-100",
                  "transition-all duration-200 hover:scale-105 active:scale-100"
                )}
                aria-label="Điều hướng nhanh"
              >
                <FocusIcon className="w-4 h-4" />
              </button>

              <button onClick={onSubmit} className={cn(buttonSecondary, "text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2.5")}>
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Nộp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Focus Mode HUD */}
      {showDesktopFocus && (
        <div className={hudContainerBase}>
          {!started ? (
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-3 text-sm font-medium">
                <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  {durationMin} phút
                </span>
                <span className="text-zinc-400 dark:text-zinc-500">•</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {total} câu
                </span>
              </div>
              <button onClick={onStart} className={buttonPrimary}>
                <Play className="w-4 h-4" />
                Bắt đầu
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                <span className="whitespace-nowrap">
                  Câu{" "}
                  <span className="px-1.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold">
                    {currentIndex + 1}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400">/{total}</span>
                </span>
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400 whitespace-nowrap">
                  <Clock className="w-4 h-4" />
                  {fmtTime(leftSec)}
                </span>
                <div className="w-32 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <button onClick={onSubmit} className={buttonSecondary}>
                <Send className="w-4 h-4" />
                Nộp
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}