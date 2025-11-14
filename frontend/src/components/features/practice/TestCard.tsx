"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Timer,
  ListChecks,
  RotateCcw,
  Play,
  Target,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============ Types ============ */
export type AttemptSummary = {
  lastAt: string;
  correct: number;
  total: number;
  acc: number;
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
  disabled?: boolean;
  disabledHint?: string;
};

/* ============ Refined EdTech Palette ============ */
const LEVEL_COLORS: Record<
  1 | 2 | 3,
  {
    primary: string;
    light: string;
    text: string;
    border: string;
    gradient: string;
    glow: string;
  }
> = {
  1: {
    primary: "bg-[#347433]",
    light: "bg-[#347433]/10 dark:bg-[#347433]/15",
    text: "text-[#347433] dark:text-[#347433]/90",
    border: "border-[#347433]/30 dark:border-[#347433]/40",
    gradient: "bg-gradient-to-r from-[#347433] to-[#3d8a3d]",
    glow: "shadow-[0_0_20px_rgba(52,116,51,0.4)]",
  },
  2: {
    primary: "bg-[#27548A]",
    light: "bg-[#27548A]/10 dark:bg-[#27548A]/15",
    text: "text-[#27548A] dark:text-[#27548A]/90",
    border: "border-[#27548A]/30 dark:border-[#27548A]/40",
    gradient: "bg-gradient-to-r from-[#27548A] to-[#2d62a0]",
    glow: "shadow-[0_0_20px_rgba(39,84,138,0.4)]",
  },
  3: {
    primary: "bg-[#BB3E00]",
    light: "bg-[#BB3E00]/10 dark:bg-[#BB3E00]/15",
    text: "text-[#BB3E00] dark:text-[#BB3E00]/90",
    border: "border-[#BB3E00]/30 dark:border-[#BB3E00]/40",
    gradient: "bg-gradient-to-r from-[#BB3E00] to-[#d14800]",
    glow: "shadow-[0_0_20px_rgba(187,62,0,0.4)]",
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
  disabled = false,
  disabledHint,
}: Props) {
  const router = useRouter();
  const done = !!attemptSummary;
  const accuracy = attemptSummary ? Math.round(attemptSummary.acc * 100) : 0;

  const href = `/${locale}/practice/${partKey}/${level}/${test}`;
  const color = LEVEL_COLORS[level];

  const levelLabel =
    level === 1 ? "Beginner" : level === 2 ? "Intermediate" : "Advanced";
  const bars = level;

  const lastAtLabel = useMemo(() => {
    const iso = attemptSummary?.lastAt;
    if (!iso) return "—";
    try {
      return new Intl.DateTimeFormat(locale || "vi-VN", {
        dateStyle: "short",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }, [attemptSummary?.lastAt, locale]);

  const goDoTest = () => {
    if (disabled) return;
    router.push(href);
  };

  const titleAttr = disabled
    ? disabledHint || "Vui lòng làm Placement Test trước"
    : undefined;

return (
  <div
    onClick={goDoTest}
    role="button"
    tabIndex={disabled ? -1 : 0}
    aria-disabled={disabled}
    title={titleAttr}
    className={cn(
      "group relative rounded-3xl p-6 overflow-hidden",
      "bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl",
      "border border-white/20 dark:border-zinc-700/50",
      "shadow-xl hover:shadow-2xl transition-all duration-500",
      // Giữ full height trong grid
      "flex flex-col h-full",
      "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-0 before:transition-opacity before:duration-500 group-hover:before:opacity-100",
      disabled
        ? "cursor-not-allowed opacity-60"
        : "cursor-pointer hover:-translate-y-2 hover:scale-[1.02] hover:ring-2 hover:ring-white/30"
    )}
    style={{
      background:
        "linear-gradient(145deg, rgba(255,255,255,0.9), rgba(245,245,245,0.7))",
    }}
  >
    {/* Glow Effect */}
    <div
      className={cn(
        "absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700",
        color.glow
      )}
    />

    {/* Header */}
    <div className="flex items-center justify-between mb-5 relative z-10">
      <div className="flex items-center gap-3">
        <div className="relative p-2 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 shadow-inner">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent" />
          <Target className="w-5 h-5 text-zinc-700 dark:text-zinc-300 relative z-10" />
        </div>
        <h3 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
          TEST {test}
        </h3>
        {accuracy >= 90 && (
          <div className="ml-1 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
            <Sparkles className="h-3 w-3" />
            <span>VIP</span>
          </div>
        )}
      </div>

      {/* Level Badge - Glass + Glow (nhỏ lại) */}
      <div
        className={cn(
          "group/badge relative inline-flex items-center gap-1.5 rounded-full px-2 py-1",
          "bg-white/70 dark:bg-zinc-800/70 backdrop-blur-md",
          "border border-white/40 dark:border-zinc-600/50",
          "shadow-md ring-1 ring-white/30 dark:ring-white/10",
          color.light,
          color.text,
          "text-[10px] font-bold uppercase tracking-[0.16em]"
        )}
        title={levelLabel}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/badge:opacity-100 transition-opacity" />
        <span className="flex items-end gap-0.5" aria-hidden="true">
          {[1, 2, 3].map((i) => {
            const active = i <= bars;
            const activeColor =
              level === 1
                ? "bg-[#347433]"
                : level === 2
                ? "bg-[#27548A]"
                : "bg-[#BB3E00]";
            return (
              <span
                key={i}
                className={cn(
                  "w-1 rounded-full transition-all duration-500",
                  i === 1 ? "h-1.5" : i === 2 ? "h-2.5" : "h-3",
                  active
                    ? `${activeColor} shadow-md`
                    : "bg-white/40 dark:bg-zinc-600/40"
                )}
              />
            );
          })}
        </span>
        {levelLabel}
      </div>
    </div>

    {/* Stats */}
    <div className="flex flex-wrap gap-4 text-sm text-zinc-700 dark:text-zinc-300">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
          <ListChecks className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
        </div>
        <span className="font-semibold">{totalQuestions} câu</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
          <Timer className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
        </div>
        <span className="font-semibold">{durationMin} phút</span>
      </div>

      {/* Luôn giữ slot thứ 3 để chiều cao stats giống nhau */}
      {done ? (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <CalendarDays className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <span className="font-semibold text-xs">{lastAtLabel}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 opacity-0">
          <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <CalendarDays className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <span className="font-semibold text-xs">placeholder</span>
        </div>
      )}
    </div>

    {/* Progress / Empty State */}
    <div className="flex-1 min-h-[70px] flex flex-col justify-center relative z-10">
      {done ? (
        <div className="space-y-3">
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600 shadow-inner">
            <div
              className={cn(
                "absolute inset-y-0 left-0 h-full rounded-full",
                color.gradient,
                "shadow-lg transition-all duration-1000 ease-out"
              )}
              style={{ width: `${accuracy}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
              {attemptSummary!.correct}/{attemptSummary!.total}
            </span>
            <span
              className={cn(
                "text-lg font-black",
                accuracy >= 80
                  ? "text-emerald-600 dark:text-emerald-400"
                  : accuracy >= 60
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-rose-600 dark:text-rose-400"
              )}
            >
              {accuracy}%
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 bg-gradient-to-br from-zinc-50/50 to-zinc-100/50 dark:from-zinc-800/50 dark:to-zinc-700/50 p-4 text-center backdrop-blur-sm">
          <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
            Chưa làm bài
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Bắt đầu ngay!
          </p>
        </div>
      )}
    </div>

    {/* Action Footer */}
    <div className="mt-5 border-t border-white/30 dark:border-zinc-700/50 relative z-10">
      <div className="flex items-center justify-between">
        {!done ? (
          disabled ? (
            <button
              type="button"
              disabled
              title={titleAttr}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-zinc-400 to-zinc-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg cursor-not-allowed opacity-70"
            >
              <Play className="w-4 h-4" />
              Làm bài ngay
            </button>
          ) : (
            <Link
              href={href}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "group/btn inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300",
                "hover:shadow-2xl hover:scale-105 active:scale-95",
                color.primary,
                "bg-gradient-to-r",
                color.gradient
              )}
            >
              <Play className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
              Làm bài ngay
            </Link>
          )
        ) : (
          <div className="flex w-full justify-start">
            {disabled ? (
              <button
                type="button"
                disabled
                title={titleAttr}
                className="inline-flex items-center gap-2 rounded-xl py-2 px-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4" />
                Làm lại
              </button>
            ) : (
              <Link
                href={href}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl py-2.5 px-5 text-sm font-bold",
                  "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/40",
                  "border border-emerald-200 dark:border-emerald-800",
                  "transition-all duration-300 hover:shadow-md"
                )}
              >
                <RotateCcw className="w-4 h-4" />
                Làm lại
              </Link>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Floating Particles */}
    {!disabled && (
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-white/60 animate-ping" />
        <Sparkles className="absolute bottom-8 left-6 h-4 w-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      </div>
    )}
  </div>
);
}

/* ================= Skeleton ================= */
export function TestCardSkeleton() {
  return (
    <div className="rounded-3xl p-6 bg-white/90 dark:bg-zinc-900/90 border border-white/20 dark:border-zinc-700/50 shadow-xl animate-pulse h-full flex flex-col backdrop-blur-xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700">
            <div className="h-5 w-5 rounded bg-zinc-300 dark:bg-zinc-600" />
          </div>
          <div className="h-7 w-24 rounded bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600" />
        </div>
        <div className="h-8 w-28 rounded-full bg-gradient-to-r from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 border border-white/30" />
      </div>

      <div className="flex gap-4 mb-5">
        <div className="h-8 w-24 rounded bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600" />
        <div className="h-8 w-20 rounded bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600" />
        <div className="h-8 w-28 rounded bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600" />
      </div>

      <div className="flex-1 min-h-[70px] flex flex-col justify-center">
        <div className="h-3 w-full rounded-full bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600 mb-3" />
        <div className="flex justify-between">
          <div className="h-5 w-20 rounded bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600" />
          <div className="h-6 w-12 rounded bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600" />
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/30 dark:border-zinc-700/50">
        <div className="h-12 w-36 rounded-2xl bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600" />
      </div>
    </div>
  );
}
