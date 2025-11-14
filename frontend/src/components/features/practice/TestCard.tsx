"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Timer,
  ListChecks,
  CheckCircle2,
  RotateCcw,
  Play,
  Target,
  CalendarDays,
} from "lucide-react";

/* ============ Types ============ */
export type AttemptSummary = {
  lastAt: string;
  correct: number;
  total: number;
  acc: number; // 0..1
  count: number;
  bestAcc?: number;
  streak?: number;
  lastAttemptId?: string;
};

type Props = {
  locale: string;
  partKey: string;
  level: 1 | 2 | 3;
  test: number;
  totalQuestions?: number;
  durationMin?: number;
  attemptSummary?: AttemptSummary;

  // NEW
  disabled?: boolean;
  disabledHint?: string;
};

/* ============ Utils ============ */
function cn(...args: Array<string | false | null | undefined>) {
  return args.filter(Boolean).join(" ");
}

const TONE: Record<
  1 | 2 | 3,
  { grad: string; soft: string; text: string; border: string }
> = {
  1: {
    grad: "bg-gradient-to-r from-amber-500 to-amber-600",
    soft: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-900/40",
  },
  2: {
    grad: "bg-gradient-to-r from-sky-500 to-sky-600",
    soft: "bg-sky-50 dark:bg-sky-950/30",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-900/40",
  },
  3: {
    grad: "bg-gradient-to-r from-violet-500 to-violet-600",
    soft: "bg-violet-50 dark:bg-violet-950/30",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-200 dark:border-violet-900/40",
  },
};

export default function TestCard({
  locale,
  partKey,
  level,
  test,
  totalQuestions = 10,
  durationMin = 10,
  attemptSummary,

  // NEW
  disabled = false,
  disabledHint,
}: Props) {
  const router = useRouter();
  const done = !!attemptSummary;
  const accuracy = attemptSummary ? Math.round(attemptSummary.acc * 100) : 0;

  const href = `/${locale}/practice/${partKey}/${level}/${test}`;
  const tone = TONE[level];

  const levelLabel =
    level === 1 ? "Beginner" : level === 2 ? "Intermediate" : "Advanced";
  const bars = level;

  const lastAtLabel = useMemo(() => {
    const iso = attemptSummary?.lastAt;
    if (!iso) return "—";
    try {
      return new Intl.DateTimeFormat(locale || "vi-VN", {
        dateStyle: "medium",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }, [attemptSummary?.lastAt, locale]);

  // NEW: chặn điều hướng khi disabled
  const goDoTest = () => {
    if (disabled) return;
    router.push(href);
  };

  // NEW: tooltip/aria cho trạng thái khóa
  const titleAttr = disabled
    ? disabledHint || "Vui lòng làm Placement Test trước"
    : undefined;

  return (
    <div
      onClick={goDoTest}
      role="button"
      tabIndex={disabled ? -1 : 0} // NEW
      aria-disabled={disabled} // NEW
      title={titleAttr} // NEW
      className={cn(
        "group relative rounded-2xl p-5",
        "border border-zinc-200 bg-white shadow-sm",
        "dark:border-zinc-700 dark:bg-zinc-800/50",
        "transition-all duration-300",
        disabled
          ? "cursor-not-allowed opacity-60" // NEW
          : "cursor-pointer hover:-translate-y-[2px] hover:shadow-lg hover:ring-2 hover:ring-zinc-900/10 dark:hover:ring-white/10",
        "flex flex-col"
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            TEST {test}
          </h3>
          {done && (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          )}
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1",
            "text-xs font-semibold uppercase",
            tone.soft,
            tone.text,
            "border",
            tone.border
          )}
          title={levelLabel}
        >
          <span className="flex items-end gap-0.5" aria-hidden="true">
            {[1, 2, 3].map((i) => {
              const active = i <= bars;
              const colorActive =
                level === 1
                  ? "bg-amber-700"
                  : level === 2
                  ? "bg-sky-700"
                  : "bg-violet-700";
              const colorInactive = "bg-zinc-300 dark:bg-zinc-600";
              return (
                <span
                  key={i}
                  className={cn(
                    "w-1.5 rounded-full transition-all duration-300",
                    i === 1 ? "h-2.5" : i === 2 ? "h-3.5" : "h-5",
                    active ? colorActive : colorInactive
                  )}
                />
              );
            })}
          </span>
          {levelLabel}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-zinc-600 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <ListChecks className="w-4 h-4" /> {totalQuestions} câu hỏi
        </span>
        <span className="flex items-center gap-1.5">
          <Timer className="w-4 h-4" /> {durationMin} phút
        </span>
        {done && (
          <span className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4" /> {lastAtLabel}
          </span>
        )}
      </div>

      <div className="min-h-[70px]">
        {done ? (
          <>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className={cn(
                  "h-full",
                  tone.grad,
                  "transition-all duration-700"
                )}
                style={{ width: `${accuracy}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-600 dark:text-zinc-400">
                {attemptSummary!.correct}/{attemptSummary!.total} đúng
              </span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {accuracy}%
              </span>
            </div>
          </>
        ) : (
          <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 py-3 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300">
            Chưa có lượt làm. Hãy bắt đầu để lưu lịch sử.
          </div>
        )}
      </div>

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between min-h-[48px]">
          {!done ? (
            // NEW: nếu disabled → không render Link, thay bằng nút “khóa”
            disabled ? (
              <button
                type="button"
                disabled
                title={titleAttr}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-400/60 px-5 py-3 text-sm font-semibold text-white shadow"
              >
                <Play className="w-4 h-4" />
                Làm bài ngay
              </button>
            ) : (
              <Link
                href={href}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow transition-all hover:scale-105 dark:bg-zinc-100 dark:text-zinc-900"
              >
                <Play className="w-4 h-4" /> Làm bài ngay
              </Link>
            )
          ) : (
            <div className="flex w-full justify-start gap-2">
              {disabled ? (
                <button
                  type="button"
                  disabled
                  title={titleAttr}
                  className="inline-flex items-center gap-2 rounded-xl py-2.5 px-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-200/50 dark:bg-zinc-800/50 cursor-not-allowed"
                >
                  <RotateCcw className="w-4 h-4" /> Làm lại
                </button>
              ) : (
                <Link
                  href={href}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-2 rounded-xl py-2.5 px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                >
                  <RotateCcw className="w-4 h-4" /> Làm lại
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* overlay chỉ khi hover và không disabled */}
      {!disabled && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-white/5 dark:to-transparent" />
      )}
    </div>
  );
}

/* ================= Skeleton ================= */
export function TestCardSkeleton() {
  return (
    <div className="rounded-2xl p-5 border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-pulse">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-5 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="h-6 w-28 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" />
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>

      {/* Progress */}
      <div className="mt-4 h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700" />

      {/* Footer */}
      <div className="mt-6 h-10 w-32 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
    </div>
  );
}