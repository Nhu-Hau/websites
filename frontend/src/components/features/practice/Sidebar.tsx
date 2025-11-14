/* eslint-disable jsx-a11y/role-supports-aria-props */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Item, ChoiceId } from "@/types/tests.types";
import { Play, Eye, EyeOff, Focus as FocusIcon, Clock } from "lucide-react";

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
  onStart,
  isAuthed,
  onLoginRequest,
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
      setLeftSec(Math.max(0, initialLeftSec as number));
      initialSecRef.current = Math.max(0, initialLeftSec as number);
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

  // Auto submit
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

  // Classes
  const asideBase =
    "hidden lg:flex flex-col fixed top-20 left-0 h-[calc(100vh-5rem)] bg-white/95 dark:bg-zinc-900/95 border-r border-zinc-200 dark:border-zinc-800 backdrop-blur-sm shadow-sm z-40 transition-all duration-300";
  const asideSize = focusMode ? "w-[52px] px-2 py-3" : "w-[240px] px-3 py-4";
  const contentHiddenCls = focusMode
    ? "opacity-0 pointer-events-none select-none"
    : "opacity-100";

  return (
    <aside
      className={`${asideBase} ${asideSize}`}
      role="complementary"
      aria-label="Sidebar"
      aria-expanded={!focusMode}
    >
      {/* Focus Toggle */}
      <button
        type="button"
        onClick={onToggleFocus}
        title="Focus mode (phím F)"
        className={`group flex w-full items-center justify-center rounded-xl p-2 transition-all duration-300 ${
          focusMode
            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
        }`}
      >
        <FocusIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
        {!focusMode && <span className="ml-2 text-xs font-bold">Focus</span>}
      </button>

      {/* Nội dung */}
      <div className={`mt-4 space-y-4 transition-opacity ${contentHiddenCls}`}>
        {/* Start Banner */}
        {!started && !resp && (
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-700 bg-gradient-to-br from-emerald-50/80 to-emerald-100/80 dark:from-emerald-900/20 dark:to-emerald-800/20 p-3 backdrop-blur-sm">
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 leading-tight">
              Thời gian bắt đầu khi bạn nhấn <strong>Bắt đầu</strong>.
            </p>
            <button
              onClick={() => (isAuthed ? onStart() : onLoginRequest?.())}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs py-2 transition-all hover:scale-105 active:scale-95 shadow-md"
            >
              <Play className="h-3.5 w-3.5" />
              Bắt đầu
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm p-3 shadow-sm">
          {!resp ? (
            <>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-zinc-700 dark:text-zinc-300">
                  {answered}/{total}
                </span>
                <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                  <Clock className="h-3.5 w-3.5" />
                  {countdownLabel}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <button
                onClick={() => {
                  onSubmit();
                  onSubmitWithLeftSec?.(leftSec);
                }}
                disabled={!canSubmit}
                className="mt-3 w-full rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-900 hover:from-zinc-700/50 hover:to-zinc-700/50 text-white font-bold text-xs py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                Nộp bài
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <Clock className="h-3.5 w-3.5" />
                Thời gian:{" "}
                <strong className="text-zinc-900 dark:text-white">
                  {timeLabel}
                </strong>
              </div>
              <button
                onClick={onToggleDetails}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-xs font-medium transition-all hover:bg-zinc-50 dark:hover:bg-zinc-700 dark:text-white"
              >
                {showDetails ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    Ẩn đáp án
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    Xem đáp án
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Question Grid */}
        <div className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm p-3 shadow-sm overflow-hidden">
          <p className="mb-2 text-xs font-bold text-zinc-800 dark:text-zinc-200">
            Câu hỏi
          </p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(2rem,1fr))] gap-1.5">
            {items.map((it, i) => {
              const picked = answers[it.id];
              const correct = resp?.answersMap?.[it.id]?.correctAnswer as
                | ChoiceId
                | undefined;

              let cls =
                "group relative flex h-8 w-8 items-center justify-center rounded-xl border-2 text-[11px] font-bold transition-all duration-200";

              if (!resp) {
                cls += picked
                  ? " bg-black text-white border-black dark:bg-zinc-700 dark:border-zinc-600"
                  : " border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:scale-110";
              } else {
                if (!picked) {
                  cls +=
                    " border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400";
                } else if (picked === correct) {
                  cls += " bg-emerald-600 text-white border-emerald-600";
                } else {
                  cls += " bg-red-600 text-white border-red-600";
                }
              }

              return (
                <button
                  key={it.id}
                  onClick={() => onJump(i)}
                  className={cls}
                  title={`Câu ${i + 1}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
