"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import {
  CalendarClock,
  ListChecks,
  Timer,
  Layers,
  Hash,
  ChevronRight,
  Trophy,
  TrendingUp,
  Clock,
  History,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Variants } from "framer-motion";
import { useTranslations } from "next-intl";

type Attempt = {
  _id: string;
  partKey: string;
  level: 1 | 2 | 3;
  test?: number | null;
  total: number;
  correct: number;
  acc: number;
  timeSec: number;
  submittedAt?: string;
  createdAt?: string;
  answersMap?: Record<string, { correctAnswer: string }>;
};

interface PracticeHistoryClientProps {
  items: Attempt[];
  total: number;
  page: number;
  limit: number;
}

function fmtTime(sec: number) {
  const m = Math.floor(Math.max(0, sec) / 60);
  const s = Math.max(0, sec) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function getAccuracyColor(acc: number) {
  if (acc >= 0.9) return "text-emerald-600 dark:text-emerald-400";
  if (acc >= 0.7) return "text-blue-600 dark:text-blue-400";
  if (acc >= 0.5) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}
function getLevelColor(level: 1 | 2 | 3) {
  return level === 1
    ? "bg-[#4C9C43]/10 text-[#4C9C43] dark:bg-[#4C9C43]/20 dark:text-[#4C9C43]/90 border-[#4C9C43]/30 dark:border-[#4C9C43]/50"
    : level === 2
    ? "bg-[#2E5EB8]/10 text-[#2E5EB8] dark:bg-[#2E5EB8]/20 dark:text-[#2E5EB8]/90 border-[#2E5EB8]/30 dark:border-[#2E5EB8]/50"
    : "bg-[#C44E1D]/10 text-[#C44E1D] dark:bg-[#C44E1D]/20 dark:text-[#C44E1D]/90 border-[#C44E1D]/30 dark:border-[#C44E1D]/50";
}

/* Motion variants */
const headerVariants: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 0.8,
    },
  },
};

const gridVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (stagger: number = 0.06) => ({
    opacity: 1,
    transition: {
      type: "spring",
      staggerChildren: stagger,
      delayChildren: 0.1,
    },
  }),
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 16,
      mass: 0.75,
    },
  },
};

export default function PracticeHistoryClient({
  items,
  total,
  page,
  limit,
}: PracticeHistoryClientProps) {
  const t = useTranslations("Practice.history");
  const base = useBasePrefix("vi");
  const hasData = items.length > 0;
  const locale = base.slice(1) || "vi";

  return (
    <div className="relative mx-auto max-w-6xl xl:max-w-7xl px-4 xs:px-6 py-10 pt-20">
      {/* ===== HEADER ===== */}
      <motion.header
        className="mb-5"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* Left block */}
          <div className="space-y-4 max-w-2xl">
            {/* Tag */}
            <div className="inline-flex items-center gap-3 rounded-2xl bg-white/90 dark:bg-zinc-900/80 backdrop-blur-xl px-3 py-2 shadow-md ring-1 ring-white/60 dark:ring-zinc-700/70">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg ring-2 ring-white/60">
                <div className="absolute inset-0 rounded-full bg-white/40 blur-md" />
                <History className="h-5 w-5 text-white relative z-10" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">
                {t("badge")}
              </span>
            </div>

            {/* Title row */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight dark:text-zinc-100">
                  {t("title")}
                </h1>
              </div>

              <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 max-w-xl leading-relaxed">
                {t("description")}
              </p>
            </div>

            {/* Stats summary */}
            {hasData && (
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <div className="group flex items-center gap-2.5 rounded-2xl border border-zinc-200/80 bg-white/90 px-4 py-2.5 text-sm shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:hover:border-zinc-600">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300 transition-transform duration-300 group-hover:scale-110">
                    <ListChecks className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                      {t("stats.totalCorrect")}
                    </p>
                    <p className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50">
                      {items.reduce((s, a) => s + a.correct, 0)}
                    </p>
                  </div>
                </div>

                <div className="group flex items-center gap-2.5 rounded-2xl border border-zinc-200/80 bg-white/90 px-4 py-2.5 text-sm shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:hover:border-zinc-600">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 transition-transform duration-300 group-hover:scale-110">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                      {t("stats.average")}
                    </p>
                    <p className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50">
                      {Math.round(
                        (items.reduce((s, a) => s + a.acc, 0) / items.length) *
                          100
                      )}
                      %
                    </p>
                  </div>
                </div>

                <div className="group flex items-center gap-2.5 rounded-2xl border border-zinc-200/80 bg-white/90 px-4 py-2.5 text-sm shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:hover:border-zinc-600">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300 transition-transform duration-300 group-hover:scale-110">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                      {t("stats.totalTime")}
                    </p>
                    <p className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50">
                      {fmtTime(items.reduce((s, a) => s + a.timeSec, 0))}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* ===== CONTENT ===== */}
      <section className="space-y-8">
        {!hasData ? (
          <motion.div
            className="flex flex-col items-center justify-center py-24 text-center"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
              mass: 0.8,
            }}
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 scale-150 rounded-full bg-gradient-to-br from-blue-400/30 to-violet-500/30 blur-3xl animate-pulse" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-violet-100 dark:from-zinc-800 dark:to-zinc-700 shadow-2xl ring-8 ring-white/50">
                <History className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
              {t("empty.title")}
            </h3>
            <p className="mt-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-md">
              {t("empty.description")}
            </p>
            <Link
              href={`${base}/practice`}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              {t("empty.startButton")} <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col gap-1 xs:flex-row xs:items-center xs:justify-between">
              <h2 className="text-base xs:text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                {t("list.title")}
              </h2>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {t("list.pagination", { count: total, page })}
              </span>
            </div>

            {/* List */}
            <motion.div
              className="mt-2 space-y-3.5 xs:space-y-4"
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              custom={0.06}
            >
              {items.map((a) => {
                const at = a.submittedAt || a.createdAt;
                const accPct = Math.round((a.acc ?? 0) * 100);
                const isPerfect = accPct === 100;

                return (
                  <motion.div key={a._id} variants={itemVariants}>
                    <Link
                      href={`${base}/practice/history/${encodeURIComponent(
                        a._id
                      )}`}
                      className={`
              group block rounded-2xl border border-zinc-200/70 dark:border-zinc-700/70
              bg-white/90 dark:bg-zinc-900/80 backdrop-blur-xl
              px-3.5 py-3 xs:px-4 sm:px-5 sm:py-3.5
              shadow-sm transition-all duration-200
              hover:shadow-lg hover:-translate-y-0.5
              ${
                isPerfect
                  ? "ring-1 ring-emerald-500/30 dark:ring-emerald-400/30"
                  : ""
              }
            `}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Left: title + badges */}
                        <div className="min-w-0 space-y-2">
                          {/* Title + Trophy */}
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className="truncate text-sm xs:text-base sm:text-lg font-semibold text-zinc-900 dark:text-white">
                              {String(a.partKey).replace("part.", "Part ")}
                              {typeof a.test === "number" &&
                                ` – Test ${a.test}`}
                            </h3>
                            {isPerfect && (
                              <Trophy className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            )}
                          </div>

                          {/* Badges */}
                          <div
                            className="
                    flex flex-wrap gap-1.5 text-[11px] xs:text-xs
                  "
                          >
                            {/* Điểm / độ chính xác */}
                            <span
                              className={`
                      inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 font-semibold
                      bg-white/80 dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700
                      ${getAccuracyColor(a.acc)}
                    `}
                            >
                              <ListChecks className="h-3.5 w-3.5" />
                              {a.correct}/{a.total} ({accPct}%)
                            </span>

                            {/* Thời gian */}
                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 font-medium text-zinc-700 dark:text-zinc-300 bg-white/80 dark:bg-zinc-800/70">
                              <Timer className="h-3.5 w-3.5" />{" "}
                              {fmtTime(a.timeSec)}
                            </span>

                            {/* Level */}
                            <span
                              className={`
                      inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 font-medium
                      ${getLevelColor(a.level)} bg-opacity-90
                    `}
                            >
                              <Layers className="h-3.5 w-3.5" /> Level {a.level}
                            </span>

                            {/* Test number */}
                            {typeof a.test === "number" && (
                              <span className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 font-medium text-zinc-700 dark:text-zinc-300 bg-white/80 dark:bg-zinc-800/70">
                                <Hash className="h-3.5 w-3.5" /> Test {a.test}
                              </span>
                            )}

                            {/* Time stamp */}
                            {at && (
                              <span className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 font-medium text-zinc-600 dark:text-zinc-400 bg-white/80 dark:bg-zinc-800/70">
                                <CalendarClock className="h-3.5 w-3.5" />
                                <time
                                  dateTime={at}
                                  className="whitespace-nowrap"
                                >
                                  {new Date(at).toLocaleString(locale, {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })}
                                </time>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: call to action */}
                        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                          <span className="text-xs xs:text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {t("list.viewDetails")}
                          </span>
                          <ChevronRight className="h-4 w-4 xs:h-5 xs:w-5 text-zinc-400 dark:text-zinc-500 transition-all group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>

            {total > items.length && (
              <div className="mt-5 text-center text-xs xs:text-sm text-zinc-500 dark:text-zinc-400">
                {t("list.showing", { shown: items.length, total, page })}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
