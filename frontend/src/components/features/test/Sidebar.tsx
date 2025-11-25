/* eslint-disable jsx-a11y/role-supports-aria-props */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Item, ChoiceId } from "@/types/tests.types";
import { Eye, EyeOff, Focus as FocusIcon, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

function fmtMMSS(sec: number) {
  const safe = Math.max(0, sec | 0);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type SidebarResp = {
  answersMap?: Record<string, { correctAnswer: ChoiceId }>;
  timeSec?: number;
} | null;

export function Sidebar({
  items,
  answers,
  resp,
  total,
  answered,
  timeLabel,
  onSubmit,
  onSubmitWithLeftSec,
  onJump,
  onToggleDetails,
  showDetails,
  countdownSec = 35 * 60,
  initialLeftSec,
  started,
  focusMode,
  onToggleFocus,
}: {
  items: Item[];
  answers: Record<string, ChoiceId>;
  resp: SidebarResp;
  total: number;
  answered: number;
  timeLabel: string;
  onSubmit: () => void;
  onSubmitWithLeftSec?: (left: number) => void;
  onJump: (i: number) => void;
  onToggleDetails: () => void;
  showDetails: boolean;
  countdownSec?: number;
  initialLeftSec?: number;
  started: boolean;
  onStart: () => void;
  isAuthed: boolean;
  onLoginRequest: () => void;
  focusMode: boolean;
  onToggleFocus: () => void;
}) {
  const t = useTranslations("test.sidebar");
  const [leftSec, setLeftSec] = useState<number>(
    Number.isFinite(initialLeftSec as number)
      ? (initialLeftSec as number)
      : countdownSec
  );
  const initialSecRef = useRef<number>(
    Number.isFinite(initialLeftSec as number)
      ? (initialLeftSec as number)
      : countdownSec
  );
  const tickingRef = useRef<number | null>(null);
  const submittedRef = useRef(false);

  // Reset khi chưa start
  useEffect(() => {
    if (!started && !resp) {
      const init = Number.isFinite(initialLeftSec as number)
        ? (initialLeftSec as number)
        : countdownSec;
      setLeftSec(init);
      initialSecRef.current = init;
      submittedRef.current = false;
    }
  }, [countdownSec, initialLeftSec, started, resp]);

  // Khi đã start và có giá trị khởi tạo mới (khôi phục từ local), cập nhật còn lại
  useEffect(() => {
    if (started && !resp && Number.isFinite(initialLeftSec as number)) {
      const safe = Math.max(0, initialLeftSec as number);
      setLeftSec(safe);
      initialSecRef.current = safe;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLeftSec, started]);

  // Timer tick
  useEffect(() => {
    if (resp || !started) {
      if (tickingRef.current) clearInterval(tickingRef.current);
      tickingRef.current = null;
      return;
    }

    if (!tickingRef.current) {
      tickingRef.current = window.setInterval(() => {
        setLeftSec((t) => (t > 0 ? t - 1 : 0));
      }, 1000);
    }

    return () => {
      if (tickingRef.current) clearInterval(tickingRef.current);
      tickingRef.current = null;
    };
  }, [resp, started]);

  // Auto submit khi hết giờ
  useEffect(() => {
    if (!resp && started && leftSec <= 0 && !submittedRef.current) {
      submittedRef.current = true;
      if (tickingRef.current) clearInterval(tickingRef.current);
      tickingRef.current = null;
      onSubmit();
      onSubmitWithLeftSec?.(leftSec);
    }
  }, [leftSec, resp, started, onSubmit, onSubmitWithLeftSec]);

  const countdownLabel = useMemo(
    () => (started ? fmtMMSS(leftSec) : "--:--"),
    [leftSec, started]
  );

  const progress = total
    ? Math.min(100, Math.round((answered / total) * 100))
    : 0;
  const canSubmit = started && !resp;

  // ==== Layout / style ====
  const asideBase =
    "hidden lg:flex flex-col fixed top-16 left-0 h-[calc(100vh-5rem)] z-40 " +
    "bg-white/95 dark:bg-zinc-900/95 border-r border-zinc-200/90 dark:border-zinc-800/90 " +
    "backdrop-blur-sm shadow-sm transition-all duration-300";
  const asideSize = focusMode ? "w-[58px] px-2.5 py-3" : "w-[252px] px-3.5 py-4";
  const contentHiddenCls = focusMode
    ? "opacity-0 pointer-events-none select-none"
    : "opacity-100";

  return (
    <aside
      className={`${asideBase} ${asideSize}`}
      role="complementary"
      aria-label={t("ariaLabel")}
      aria-expanded={!focusMode}
    >
      {/* Focus Toggle */}
      <button
        type="button"
        onClick={onToggleFocus}
        title={t("focusModeTitle")}
        className={`group flex w-full items-center justify-center rounded-xl p-2 transition-all duration-300 ${
          focusMode
            ? "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200 shadow-sm"
            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        }`}
      >
        <FocusIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
        {!focusMode && (
          <span className="ml-2 text-[11px] font-bold tracking-[0.16em] uppercase">
            {t("focus")}
          </span>
        )}
      </button>

      {/* Nội dung chính */}
      <div
        className={`mt-4 flex-1 space-y-4 overflow-hidden transition-opacity duration-200 ${contentHiddenCls}`}
      >
        {/* Stats */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white/90 p-3 text-xs shadow-sm backdrop-blur-sm dark:border-zinc-700/80 dark:bg-zinc-900/90">
          {!resp ? (
            <>
              <div className="flex items-center justify-between text-[11px] font-medium">
                <div className="flex flex-col">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {t("progress")}
                  </span>
                  <span className="mt-0.5 text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                    {answered}/{total} {t("questions")}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                    <Clock className="h-3.5 w-3.5" />
                    {t("time")}
                  </span>
                  <span className="mt-0.5 text-[13px] font-semibold text-red-500 dark:text-sky-300">
                    {countdownLabel}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/90 dark:bg-zinc-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 via-sky-500 to-sky-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <button
                onClick={() => {
                  onSubmit();
                  onSubmitWithLeftSec?.(leftSec);
                }}
                disabled={!canSubmit}
                className="mt-3 w-full rounded-xl bg-zinc-900 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                {t("submit")}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                  <Clock className="h-3.5 w-3.5" />
                  {t("timeSpent")}
                </span>
                <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                  {timeLabel}
                </span>
              </div>

              <button
                onClick={onToggleDetails}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 px-3 py-2 text-[11px] font-semibold text-zinc-800 transition-all hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                {showDetails ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    {t("hideAnswers")}
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    {t("showAnswers")}
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Question Grid */}
        <div className="flex-1 rounded-2xl border border-zinc-200/80 bg-white/90 p-3 shadow-sm backdrop-blur-sm dark:border-zinc-700/80 dark:bg-zinc-900/90">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              {t("questionList")}
            </p>
            {!resp && (
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                {t("quickJump")}
              </span>
            )}
          </div>

          <div className="max-h-[calc(100vh-20rem)] overflow-y-auto pr-0.5">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(2.1rem,1fr))] gap-1.5">
              {items.map((it, i) => {
                const picked = answers[it.id];
                const correct = resp?.answersMap?.[it.id]?.correctAnswer as
                  | ChoiceId
                  | undefined;

                let cls =
                  "group relative flex h-8 w-8 items-center justify-center rounded-xl border text-[11px] font-semibold transition-all duration-150";

                if (!resp) {
                  // Trong lúc làm bài
                  if (picked) {
                    cls +=
                      " border-sky-500 bg-sky-50 text-sky-700 shadow-xs " +
                      "dark:border-sky-400 dark:bg-sky-900/40 dark:text-sky-100";
                  } else {
                    cls +=
                      " border-zinc-200 bg-zinc-50 text-zinc-700 " +
                      "hover:border-zinc-300 hover:bg-zinc-100 hover:scale-105 " +
                      "dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700";
                  }
                } else {
                  // Sau khi nộp
                  if (!picked) {
                    cls +=
                      " border-zinc-200 bg-zinc-100 text-zinc-500 " +
                      "dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400";
                  } else if (picked === correct) {
                    cls +=
                      " border-lime-600 bg-lime-600 text-white shadow-sm";
                  } else {
                    cls +=
                      " border-red-600 bg-red-600 text-white shadow-sm";
                  }
                }

                return (
                  <button
                    key={it.id}
                    onClick={() => onJump(i)}
                    className={cls}
                    title={t("questionTitle", { n: i + 1 })}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}