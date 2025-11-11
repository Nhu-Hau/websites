"use client";

import React from "react";
import { Timer, Clock, Focus as FocusIcon, Send, Play } from "lucide-react";

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

  return (
    <>
      {/* Mobile HUD - Chưa bắt đầu */}
      {showMobile && !started && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl lg:hidden">
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-300 dark:border-zinc-700 px-5 py-4 shadow-2xl">
            <div className="flex items-center gap-4 text-sm font-medium">
              <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                {durationMin} phút
              </span>
              <span className="text-zinc-600 dark:text-zinc-400">/</span>
              <span className="text-zinc-700 dark:text-zinc-300">
                {total} câu
              </span>
            </div>
            <button
              onClick={onStart}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all hover:scale-105"
            >
              <Play className="w-4 h-4" />
              Bắt đầu
            </button>
          </div>
        </div>
      )}

      {/* Mobile HUD - Đang làm */}
      {showMobile && started && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl lg:hidden">
          <div
            className="
              flex items-center justify-between
              gap-2 sm:gap-4
              rounded-2xl
              bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl
              border border-zinc-300 dark:border-zinc-700
              px-3 py-2.5 sm:px-5 sm:py-4
              shadow-2xl text-[11px] sm:text-sm font-medium
            "
          >
            <div className="flex items-center gap-2 sm:gap-4 text-zinc-800 dark:text-zinc-200">
              Câu{" "}
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                {currentIndex + 1}
              </span>
              / {total}
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-2" />
                {fmtTime(leftSec)}
              </span>
              <div className="w-16 xs:w-44 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden ml-2">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Nút mở điều hướng nhanh */}
              <button
                onClick={onOpenQuickNav}
                className="
                  hidden sm:flex items-center gap-1.5
                  px-3 py-1.5 rounded-xl
                  bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700
                  text-zinc-800 dark:text-zinc-100 font-semibold
                  transition-all hover:scale-105 active:scale-100
                "
                aria-label="Điều hướng nhanh"
              >
                <FocusIcon className="w-4 h-4" />
              </button>
              {/* icon-only cho màn rất nhỏ */}
              <button
                onClick={onOpenQuickNav}
                className="
                  sm:hidden grid place-items-center
                  w-9 h-9 rounded-xl
                  bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700
                  text-zinc-800 dark:text-zinc-100 font-semibold
                  transition-all hover:scale-105 active:scale-100
                "
                aria-label="Điều hướng nhanh"
              >
                <FocusIcon className="w-4 h-4" />
              </button>

              <button
                onClick={onSubmit}
                className="
                  flex items-center gap-1.5 sm:gap-2
                  px-3 py-1.5 sm:px-5 sm:py-2.5
                  rounded-xl bg-black hover:bg-zinc-800
                  text-white font-bold text-[11px] sm:text-sm
                  transition-all hover:scale-105 active:scale-100
                "
              >
                <Send className="w-4 h-4" />
                Nộp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Focus Mode HUD */}
      {showDesktopFocus && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl">
          {!started ? (
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-300 dark:border-zinc-700 px-5 py-4 shadow-2xl">
              <div className="flex items-center gap-4 text-sm font-medium">
                <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  {durationMin} phút
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">/</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {total} câu
                </span>
              </div>
              <button
                onClick={onStart}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all hover:scale-105"
              >
                <Play className="w-4 h-4" />
                Bắt đầu
              </button>
            </div>
          ) : (
            <div
              className="
                flex items-center justify-between
                gap-2 sm:gap-4
                rounded-2xl
                bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl
                border border-zinc-300 dark:border-zinc-700
                px-3 py-2.5 sm:px-5 sm:py-4
                shadow-2xl text-[11px] sm:text-sm font-medium
              "
            >
              <div className="flex items-center gap-2 sm:gap-4 text-zinc-800 dark:text-zinc-200">
                Câu{" "}
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                  {currentIndex + 1}
                </span>
                / {total}
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-2" />
                  {fmtTime(leftSec)}
                </span>
                <div className="w-[70px] sm:w-32 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden ml-2">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <button
                onClick={onSubmit}
                className="
                  flex items-center gap-1.5 sm:gap-2
                  px-3 py-1.5 sm:px-5 sm:py-2.5
                  rounded-xl bg-black hover:bg-zinc-800
                  text-white font-bold text-[11px] sm:text-sm
                  transition-all hover:scale-105 active:scale-100
                "
              >
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