/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type { GradeResp } from "@/types/placement.types";
import React from "react";
import {
  Gauge,
  Headphones,
  BookOpen,
  Timer,
  Target,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Zap,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

// === UTILS ===
function buildPracticeHref(locale: string, partKey: string, level: 1 | 2 | 3) {
  return `/${locale}/practice/${encodeURIComponent(partKey)}?level=${level}`;
}
function partLabel(partKey: string) {
  const n = partKey.match(/\d+/)?.[0];
  return n ? `Part ${n}` : partKey;
}
function recommendLevel(acc: number): 1 | 2 | 3 {
  if (acc < 0.55) return 1;
  if (acc < 0.7) return 2;
  return 3;
}
function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
function toToeicStep5(raw: number, min: number, max: number) {
  const rounded = Math.round(raw / 5) * 5;
  return Math.min(max, Math.max(min, rounded));
}

export function ResultsPanel({
  resp,
  timeLabel,
  onToggleDetails,
  showDetails,
  variant = "default",
}: {
  resp: GradeResp & {
    predicted?: { overall: number; listening: number; reading: number };
    partStats?: Record<string, { total: number; correct: number; acc: number }>;
    weakParts?: string[];
  };
  timeLabel?: string;
  onToggleDetails?: () => void;
  showDetails?: boolean;
  variant?: "default" | "practice";
}) {
  const locale = useLocale();
  const t = useTranslations("test.results");

  const partsSorted = React.useMemo(() => {
    const entries = Object.entries(resp.partStats || {});
    return entries.sort(([a], [b]) => {
      const na = parseInt(a.match(/\d+/)?.[0] || "0", 10);
      const nb = parseInt(b.match(/\d+/)?.[0] || "0", 10);
      return na - nb;
    });
  }, [resp.partStats]);

  const rawL = (resp.listening?.acc || 0) * 495;
  const rawR = (resp.reading?.acc || 0) * 495;
  const predictedL = toToeicStep5(resp.predicted?.listening ?? rawL, 5, 495);
  const predictedR = toToeicStep5(resp.predicted?.reading ?? rawR, 5, 495);
  const predictedOverall = toToeicStep5(
    resp.predicted?.overall ?? predictedL + predictedR,
    10,
    990
  );

  return (
    <div className="space-y-6 sm:space-y-7 lg:space-y-8">
      {/* 1. KPI CARDS – clean SaaS style */}
      {variant !== "practice" && (
        <section className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* OVERALL */}
          <div className="relative rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 shadow-sm shadow-zinc-900/5 dark:shadow-black/40 p-4 sm:p-5 lg:p-6 overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 -top-10 h-24 bg-gradient-to-br from-zinc-100/80 via-transparent to-zinc-50/70 dark:from-zinc-800/60 dark:via-transparent dark:to-zinc-900/30" />
            <div className="relative flex items-center gap-3 sm:gap-4">
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                <Gauge className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                  {t("estimatedToeic")}
                </p>
                <p className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50 leading-tight">
                  {predictedOverall}
                  <span className="ml-1 text-sm sm:text-base font-semibold text-zinc-500 dark:text-zinc-400">
                    / 990
                  </span>
                </p>
                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                  {t("combinedScore")}
                </p>
              </div>
            </div>
          </div>

          {/* LISTENING */}
          <div className="rounded-2xl border border-emerald-100/80 dark:border-emerald-900/60 bg-white/95 dark:bg-zinc-900/90 shadow-sm shadow-emerald-500/10 p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white dark:bg-emerald-500">
                <Headphones className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                  {t("listening")}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-800 dark:text-emerald-200 leading-tight">
                  {predictedL} / 495
                </p>
                <p className="text-[11px] sm:text-xs text-emerald-700/80 dark:text-emerald-200/80 mt-0.5">
                  {t("accuracy")}:{" "}
                  <span className="font-semibold">
                    {((resp.listening?.acc || 0) * 100).toFixed(0)}%
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* READING */}
          <div className="rounded-2xl border border-sky-100/80 dark:border-sky-900/60 bg-white/95 dark:bg-zinc-900/90 shadow-sm shadow-sky-500/10 p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-sky-600 text-white dark:bg-sky-500">
                <BookOpen className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">
                  {t("reading")}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-sky-800 dark:text-sky-200 leading-tight">
                  {predictedR} / 495
                </p>
                <p className="text-[11px] sm:text-xs text-sky-700/80 dark:text-sky-200/80 mt-0.5">
                  {t("accuracy")}:{" "}
                  <span className="font-semibold">
                    {((resp.reading?.acc || 0) * 100).toFixed(0)}%
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. OVERVIEW */}
      <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/90 shadow-sm shadow-zinc-900/5 dark:shadow-black/40 p-4 sm:p-5 lg:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-center text-zinc-950 dark:text-zinc-50 mb-4 sm:mb-5">
          {t("overview")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
          <div className="rounded-xl bg-zinc-50/90 dark:bg-zinc-800/70 px-3 sm:px-4 py-3 sm:py-4">
            <p className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {t("correctCount")}
            </p>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-zinc-50">
              {resp.correct}
              <span className="text-base sm:text-lg font-semibold text-zinc-500 dark:text-zinc-400">
                {" "}
                / {resp.total}
              </span>
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50/95 dark:bg-emerald-950/50 px-3 sm:px-4 py-3 sm:py-4">
            <p className="text-[11px] sm:text-xs font-medium text-emerald-700 dark:text-emerald-300/90">
              {t("totalAccuracy")}
            </p>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
              {(resp.acc * 100).toFixed(0)}%
            </p>
          </div>

          <div className="rounded-xl bg-zinc-50/90 dark:bg-zinc-800/70 px-3 sm:px-4 py-3 sm:py-4">
            <p className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {t("timeSpent")}
            </p>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-zinc-50">
              {timeLabel || fmtTime(resp.timeSec)}
            </p>
          </div>
        </div>

        {onToggleDetails && (
          <button
            onClick={onToggleDetails}
            className={`mt-4 sm:mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition-all ${
              showDetails
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/80"
                : "bg-zinc-950 text-white hover:bg-zinc-800 border border-zinc-900 shadow-md shadow-zinc-900/25"
            }`}
          >
            {showDetails ? (
              <>
                <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
                {t("hideDetails")}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
                {t("showDetails")}
              </>
            )}
          </button>
        )}
      </section>

      {/* 3. PHÂN TÍCH THEO PART */}
      {partsSorted.length > 0 && (
        <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/90 shadow-md shadow-zinc-900/10 dark:shadow-black/40 p-4 sm:p-5 lg:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  {t("partAnalysis")}
                </h3>
                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                  {t("partAnalysisDesc")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
              <Timer className="w-3.5 h-3.5" />
              <span>{t("miniTestInfo")}</span>
            </div>
          </div>

          {/* Grid Parts */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {partsSorted.map(([pk, stat]) => {
              const lv = recommendLevel(stat.acc);
              const lastAcc = Math.round(stat.acc * 100);
              const isFiniteAcc = Number.isFinite(lastAcc);

              const levelConfig = {
                1: {
                  bg: "bg-emerald-50 dark:bg-emerald-900/15",
                  border: "border-emerald-200 dark:border-emerald-800",
                  text: "text-emerald-800 dark:text-emerald-300",
                  icon: "text-emerald-500 dark:text-emerald-300",
                },
                2: {
                  bg: "bg-sky-50 dark:bg-sky-900/15",
                  border: "border-sky-200 dark:border-sky-800",
                  text: "text-sky-800 dark:text-sky-300",
                  icon: "text-sky-500 dark:text-sky-300",
                },
                3: {
                  bg: "bg-violet-50 dark:bg-violet-900/15",
                  border: "border-violet-200 dark:border-violet-800",
                  text: "text-violet-800 dark:text-violet-300",
                  icon: "text-violet-500 dark:text-violet-300",
                },
              } as const;

              const config = (lv && (levelConfig as any)[lv]) || null;

              return (
                <div
                  key={pk}
                  className="group rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/70 p-3.5 sm:p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  {/* Part Title + Level */}
                  <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3">
                    <h4 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                      {partLabel(pk)}
                    </h4>
                    {config ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] sm:text-xs font-semibold border ${config.border} ${config.bg} ${config.text}`}
                      >
                        <Zap className={`w-3 h-3 ${config.icon}`} />
                        {t("level", { lv })}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </div>

                  {/* Accuracy bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] sm:text-xs">
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {t("currentAccuracy")}
                      </span>
                      <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                        {isFiniteAcc ? `${lastAcc}%` : "—"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFiniteAcc
                            ? lastAcc >= 80
                              ? "bg-emerald-500"
                              : lastAcc >= 60
                              ? "bg-sky-500"
                              : "bg-amber-500"
                            : "bg-zinc-400"
                        }`}
                        style={{
                          width: isFiniteAcc
                            ? `${Math.min(lastAcc, 100)}%`
                            : "0%",
                        }}
                      />
                    </div>
                    <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                      {t("correctRatio", { correct: stat.correct, total: stat.total })}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="mt-3 sm:mt-4">
                    <Link
                      href={
                        lv
                          ? buildPracticeHref(locale, pk, lv)
                          : `/${locale}/practice/${encodeURIComponent(pk)}`
                      }
                      className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold bg-zinc-950 text-white hover:bg-zinc-800 shadow-sm hover:shadow-md transition-all duration-150 active:scale-95 w-full"
                    >
                      {t("practiceNow")}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gợi ý ưu tiên */}
          <div className="mt-5 sm:mt-6 rounded-xl border border-amber-200/80 dark:border-amber-900/70 bg-amber-50/90 dark:bg-amber-950/60 px-3.5 sm:px-4 py-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-[12px] sm:text-sm font-medium text-amber-900 dark:text-amber-100">
                {resp.weakParts?.length ? (
                  <>
                    {t("priorityPractice")}{" "}
                    <strong className="font-bold">
                      {resp.weakParts.map(partLabel).join(", ")}
                    </strong>
                    {t("weakPartsDesc")}
                  </>
                ) : (
                  t("steadyProgress")
                )}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}