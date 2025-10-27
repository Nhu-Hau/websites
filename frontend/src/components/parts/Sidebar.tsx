//frontend/src/components/parts/Sidebar.tsx
"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Item, ChoiceId } from "@/types/tests";
import type { GradeResp } from "@/types/placement";
import { FaRegClock } from "react-icons/fa";
import {
  ListChecks,
  Timer as TimerIcon,
  Play,
  LogIn,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
} from "lucide-react";

function fmtMMSS(sec: number) {
  const safe = Math.max(0, sec | 0);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

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
  started,
  onStart,
  isAuthed,
  onLoginRequest,
}: {
  items: Item[];
  answers: Record<string, ChoiceId>;
  resp: GradeResp | null;
  total: number;
  answered: number;
  timeLabel: string;
  onSubmit: () => void;
  onSubmitWithLeftSec?: (left: number) => void; // ⬅️ mới
  onJump: (i: number) => void;
  onToggleDetails: () => void;
  showDetails: boolean;
  countdownSec?: number;
  started: boolean;
  onStart: () => void;
  isAuthed: boolean;
  onLoginRequest: () => void;
}) {
  const [leftSec, setLeftSec] = useState<number>(countdownSec);

  const initialSecRef = useRef<number>(countdownSec);

  const tickingRef = useRef<number | null>(null);
  const submittedRef = useRef(false);

  const router = useRouter();

  useEffect(() => {
    if (!started && !resp) {
      setLeftSec(countdownSec);
      initialSecRef.current = countdownSec;
      submittedRef.current = false;
    }
  }, [countdownSec, started, resp]);

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

  const canSubmit = started && !resp;
  const progress = total ? Math.min(100, Math.round((answered / total) * 100)) : 0;

  return (
    <aside className="col-span-1">
      <div className="sticky top-24 h-[calc(100vh-5rem)] overflow-y-auto space-y-5 pb-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-gray-700 px-3 py-1.5 text-sm font-medium">
              <ListChecks className="h-4 w-4" />
              {total} câu
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-100 dark:bg-sky-900/30 px-3 py-1.5 text-sm font-medium text-sky-700 dark:text-sky-400">
              <TimerIcon className="h-4 w-4" />
              {Math.ceil(initialSecRef.current / 60)} phút
            </span>
          </div>
        </div>

        {/* Start Banner */}
        {!started && !resp && (
          <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/30 p-4 border border-amber-200 dark:border-amber-700">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Thời gian bắt đầu khi bạn nhấn <strong>Bắt đầu</strong>.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => (isAuthed ? onStart() : onLoginRequest?.())}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 hover:bg-black text-white px-4 py-2 font-semibold transition-all"
              >
                <Play className="h-4 w-4" />
                Bắt đầu
              </button>
              {!isAuthed && (
                <button
                  onClick={() => router.push("/auth/login")}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <LogIn className="h-4 w-4" />
                  Đăng nhập
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-4">
          {!resp ? (
            <>
              <div className="flex items-center justify-between text-sm font-medium">
                <span>
                  Đã chọn: <strong>{answered}/{total}</strong>
                </span>
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <FaRegClock className="h-4 w-4" />
                  {countdownLabel}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <button
                onClick={() => { onSubmit(); onSubmitWithLeftSec?.(leftSec); }}
                disabled={!canSubmit}
                className="w-full rounded-lg bg-gradient-to-r from-slate-900 to-black hover:from-black hover:to-slate-900 text-white py-2.5 font-semibold disabled:opacity-50 transition-all"
              >
                Nộp bài
              </button>
            </>
          ) : (
            <>
              <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <FaRegClock className="h-4 w-4" />
                Thời gian: <strong>{timeLabel}</strong>
              </div>
              <button
                onClick={onToggleDetails}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showDetails ? "Ẩn đáp án" : "Xem đáp án"}
              </button>
            </>
          )}
        </div>

        {/* Legend */}
        {resp && (
          <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
            <p className="font-semibold text-sm mb-2">Chú thích</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="flex items-center gap-1 rounded-full bg-emerald-600 text-white px-2.5 py-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Đúng
              </span>
              <span className="flex items-center gap-1 rounded-full bg-red-600 text-white px-2.5 py-1">
                <XCircle className="h-3.5 w-3.5" /> Sai
              </span>
              <span className="flex items-center gap-1 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2.5 py-1">
                Bỏ trống
              </span>
            </div>
          </div>
        )}

        {/* Question Grid */}
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
          <p className="font-semibold text-sm mb-3">Câu hỏi</p>
          <div className="flex flex-wrap gap-2 justify-start">
            {items.map((it, i) => {
              const picked = answers[it.id];
              const correct = resp?.answersMap?.[it.id]?.correctAnswer as ChoiceId | undefined;
              let cls =
                "min-w-10 h-10 rounded-full border-2 font-bold text-sm flex items-center justify-center transition-all";

              if (!resp) {
                cls += picked
                  ? " bg-slate-900 text-white border-slate-900"
                  : " border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700";
              } else {
                if (!picked)
                  cls +=
                    " bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600";
                else if (picked === correct)
                  cls += " bg-emerald-600 text-white border-emerald-600";
                else cls += " bg-red-600 text-white border-red-600";
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