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
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ================== TYPES ================== */
export interface AttemptSummary {
  correct: number;
  total: number;
  acc: number; // accuracy 0–1
  lastAt: string; // ISO string
}

export interface TestCardProps {
  locale: string;
  partKey: string;
  level: 1 | 2 | 3;
  test: number;
  totalQuestions?: number;
  durationMin?: number;
  attemptSummary?: AttemptSummary | null;
  disabled?: boolean;
  disabledHint?: string;
}

/* ================== LEVEL COLORS ================== */
const LEVEL_COLORS = {
  1: {
    gradient: "from-[#6BBF59] to-[#4C9C43]",
    accent: "bg-[#4C9C43]",
    text: "text-[#4C9C43]",
    chipBg: "bg-[#4C9C43]/10",
    borderHover: "hover:border-[#4C9C43]/80 dark:hover:border-[#4C9C43]/60",
  },
  2: {
    gradient: "from-[#4A7AD0] to-[#2E5EB8]",
    accent: "bg-[#2E5EB8]",
    text: "text-[#2E5EB8]",
    chipBg: "bg-[#2E5EB8]/10",
    borderHover: "hover:border-[#2E5EB8]/80 dark:hover:border-[#2E5EB8]/60",
  },
  3: {
    gradient: "from-[#E06C39] to-[#C44E1D]",
    accent: "bg-[#C44E1D]",
    text: "text-[#C44E1D]",
    chipBg: "bg-[#C44E1D]/10",
    borderHover: "hover:border-[#C44E1D]/80 dark:hover:border-[#C44E1D]/60",
  },
} as const;

// subtle motion variants cho card
const cardVariants = {
  initial: { opacity: 0, y: -10, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 110,
      damping: 16,
      mass: 0.8,
    },
  },
};

export function TestCardSkeleton() {
  return (
    <motion.div
      className="h-full rounded-2xl border border-zinc-200/90 bg-white px-3.5 py-3.5 xs:px-4 xs:py-4 sm:px-5 sm:py-5 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900 animate-pulse"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 110,
        damping: 16,
        mass: 0.75,
      }}
    >
      <div className="mb-3 h-1 w-full rounded-t-2xl bg-zinc-100 dark:bg-zinc-800" />
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          <div className="space-y-2">
            <div className="h-4 w-16 rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-3 w-24 rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
        <div className="h-6 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800" />
      </div>

      {/* Stats */}
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-3 w-16 rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
        ))}
      </div>

      {/* Progress placeholder */}
      <div className="mb-3 space-y-2.5">
        <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
        <div className="flex items-center justify-between">
          <div className="h-3 w-20 rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-4 w-10 rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>

      {/* Footer button */}
      <div className="border-t border-zinc-200/80 pt-2.5 dark:border-zinc-800/80">
        <div className="h-9 w-28 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      </div>
    </motion.div>
  );
}

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
}: TestCardProps) {
  const router = useRouter();
  const done = !!attemptSummary;
  const accuracy = attemptSummary ? Math.round(attemptSummary.acc * 100) : 0;

  const href = `/${locale}/practice/${partKey}/${level}/${test}`;
  const color = LEVEL_COLORS[level];

  const levelLabel =
    level === 1 ? "Beginner" : level === 2 ? "Intermediate" : "Advanced";

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
    if (!disabled) router.push(href);
  };

  return (
    <motion.div
      onClick={goDoTest}
      role="button"
      title={disabled ? disabledHint : undefined}
      className={cn(
        "group relative flex h-full flex-col rounded-lg border bg-white dark:bg-zinc-900",
        // padding mobile gọn, lớn dần theo breakpoint
        "px-3.5 py-3.5 xs:px-4 xs:py-4 sm:px-5 sm:py-5",
        "border-zinc-200/90 dark:border-zinc-700/80 shadow-sm",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        !disabled && color.borderHover
      )}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={disabled ? undefined : { scale: 1.01, y: -3 }}
      whileTap={disabled ? undefined : { scale: 0.99, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 18,
        mass: 0.7,
      }}
    >
      {/* Thanh màu mỏng trên đỉnh card */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r",
          color.gradient
        )}
      />

      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-800">
            <Target className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
          </div>

          <div className="flex flex-col">
            <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Test {test}
            </h3>
            {done && (
              <span className="mt-0.5 text-[10px] xs:text-[11px] text-zinc-500 dark:text-zinc-400">
                Lần gần nhất: {lastAtLabel}
              </span>
            )}
          </div>

          {accuracy >= 90 && (
            <motion.div
              className="ml-1 hidden xs:inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-semibold"
              initial={{ opacity: 0, scale: 0.8, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 150,
                damping: 16,
                mass: 0.6,
                delay: 0.05,
              }}
            >
              <Sparkles className="h-3 w-3" />
              <span>High score</span>
            </motion.div>
          )}
        </div>

        {/* Level chip */}
        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-full",
            "px-2.5 py-0.5 text-[10px] xs:text-[11px] font-medium",
            "border border-zinc-200 dark:border-zinc-700",
            color.chipBg,
            color.text
          )}
        >
          <span className="hidden sm:inline">{levelLabel}</span>
          <span className="sm:hidden whitespace-nowrap">Lv. {level}</span>
        </div>
      </div>

      {/* Stats: 2 cột cho mobile, 3 cột cho >=sm */}
      <div className="mb-3 grid grid-cols-2 gap-2 text-[11px] xs:text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-3">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-50 dark:bg-zinc-800">
            <ListChecks className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <span className="font-medium">{totalQuestions} câu</span>
        </div>

        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-50 dark:bg-zinc-800">
            <Timer className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <span className="font-medium">{durationMin} phút</span>
        </div>

        {done ? (
          <div className="hidden sm:flex items-center gap-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-50 dark:bg-zinc-800">
              <CalendarDays className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {lastAtLabel}
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 opacity-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-50 dark:bg-zinc-800" />
            <span className="text-xs">—</span>
          </div>
        )}
      </div>

      {/* Progress / Empty */}
      <div className="mb-3 flex flex-1 flex-col justify-center">
        {done ? (
          <div className="space-y-2.5">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <motion.div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r",
                  color.gradient
                )}
                initial={{ width: 0 }}
                animate={{ width: `${accuracy}%` }}
                transition={{
                  type: "spring",
                  stiffness: 80,
                  damping: 20,
                  mass: 1,
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] xs:text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {attemptSummary?.correct ?? 0}/{attemptSummary?.total ?? 0} câu
                đúng
              </span>
              <span
                className={cn(
                  "text-sm xs:text-base font-semibold",
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
          <div className="rounded-xl border border-dashed border-zinc-300 px-3 py-2.5 text-center text-xs xs:text-[13px] dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
            <p className="font-medium text-zinc-700 dark:text-zinc-300">
              Chưa làm bài
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              Bắt đầu ngay để theo dõi tiến độ.
            </p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="mt-auto border-t border-zinc-200/80 pt-2.5 dark:border-zinc-800/80">
        {!done ? (
          disabled ? (
            <button
              disabled
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-300 px-3 py-2 text-xs xs:text-sm font-semibold text-white cursor-not-allowed"
            >
              <Play className="h-4 w-4" />
              Làm bài ngay
            </button>
          ) : (
            <Link
              href={href}
              className={cn(
                "inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs xs:text-sm font-semibold text-white",
                "bg-gradient-to-r",
                color.gradient,
                "shadow-sm hover:shadow-md transition-all"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <Play className="h-4 w-4" />
              Làm bài ngay
            </Link>
          )
        ) : (
          <Link
            href={href}
            className={cn(
              "inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs xs:text-sm font-semibold",
              "border bg-white dark:bg-zinc-900 border-current",
              color.text,
              "transition-all",
              "hover:text-white hover:bg-gradient-to-r hover:shadow-md",
              color.gradient
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <RotateCcw className="h-4 w-4" />
            Làm lại
          </Link>
        )}
      </div>
    </motion.div>
  );
}
