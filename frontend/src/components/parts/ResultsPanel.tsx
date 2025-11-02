/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type { GradeResp } from "@/types/placement";
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
import { useLocale } from "next-intl";

// === UTILS ===
function buildPracticeHref(locale: string, partKey: string, level: 1 | 2 | 3) {
  return `/${locale}/practice/${encodeURIComponent(partKey)}?level=${level}`;
}
function partLabel(partKey: string) {
  const n = partKey.match(/\d+/)?.[0];
  return n ? `Part ${n}` : partKey;
}
function statusFromAcc(acc: number) {
  if (acc < 0.55)
    return {
      key: "weak",
      label: "Yếu",
      color:
        "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    };
  if (acc < 0.7)
    return {
      key: "avg",
      label: "Trung bình",
      color:
        "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    };
  if (acc < 0.85)
    return {
      key: "good",
      label: "Khá",
      color:
        "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800",
    };
  return {
    key: "great",
    label: "Tốt",
    color:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  };
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

// === COMPONENT ===
export function ResultsPanel({
  resp,
  timeLabel,
  onToggleDetails,
  showDetails,
}: {
  resp: GradeResp & {
    predicted?: { overall: number; listening: number; reading: number };
    partStats?: Record<string, { total: number; correct: number; acc: number }>;
    weakParts?: string[];
  };
  timeLabel?: string;
  onToggleDetails?: () => void;
  showDetails?: boolean;
}) {
  const locale = useLocale();

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
    <div className="space-y-5 xs:space-y-6">
      {/* 1. KPI CARDS */}
      <section className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 xs:gap-4">
        {/* OVERALL */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4 xs:p-5 md:p-6 bg-white/80 dark:bg-zinc-800/70 backdrop-blur-xl shadow-sm">
          <div className="flex items-center gap-3 xs:gap-4">
            <div className="p-2.5 xs:p-3 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-700 dark:to-zinc-800">
              <Gauge className="h-6 w-6 xs:h-7 xs:w-7 md:h-8 md:w-8 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div>
              <p className="text-xs xs:text-sm font-medium text-zinc-600 dark:text-zinc-400">
                TOEIC
              </p>
              <p className="text-2xl xs:text-3xl md:text-3xl font-black text-zinc-900 dark:text-white leading-tight">
                {predictedOverall}
                <span className="text-sm xs:text-base md:text-lg font-bold text-zinc-500 dark:text-zinc-400">
                  {" "}
                  / 990
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* LISTENING */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4 xs:p-5 md:p-6 bg-white/80 dark:bg-zinc-800/70 backdrop-blur-xl shadow-sm">
          <div className="flex items-center gap-3 xs:gap-4">
            <div className="p-2.5 xs:p-3 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800">
              <Headphones className="h-6 w-6 xs:h-7 xs:w-7 md:h-8 md:w-8 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs xs:text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Listening
              </p>
              <p className="text-xl xs:text-2xl font-bold text-emerald-700 dark:text-emerald-400 leading-tight">
                {predictedL} / 495
              </p>
              <p className="text-[11px] xs:text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {(resp.listening.acc * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        {/* READING */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4 xs:p-5 md:p-6 bg-white/80 dark:bg-zinc-800/70 backdrop-blur-xl shadow-sm">
          <div className="flex items-center gap-3 xs:gap-4">
            <div className="p-2.5 xs:p-3 rounded-full bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900 dark:to-sky-800">
              <BookOpen className="h-6 w-6 xs:h-7 xs:w-7 md:h-8 md:w-8 text-sky-700 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-xs xs:text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Reading
              </p>
              <p className="text-xl xs:text-2xl font-bold text-sky-700 dark:text-sky-400 leading-tight">
                {predictedR} / 495
              </p>
              <p className="text-[11px] xs:text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {(resp.reading.acc * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TỔNG QUAN */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4 xs:p-5 md:p-6 bg-white/80 dark:bg-zinc-800/70 backdrop-blur-xl shadow-sm">
        <h2 className="text-lg xs:text-xl font-bold text-center text-zinc-900 dark:text-white mb-4 xs:mb-5">
          TỔNG QUAN
        </h2>
        <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 xs:gap-4 text-center">
          <div className="p-3 xs:p-4">
            <p className="text-xs xs:text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Số câu đúng
            </p>
            <p className="text-2xl xs:text-3xl font-bold text-zinc-900 dark:text-white mt-1">
              {resp.correct} / {resp.total}
            </p>
          </div>
          <div className="p-3 xs:p-4">
            <p className="text-xs xs:text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Độ chính xác
            </p>
            <p className="text-2xl xs:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {(resp.acc * 100).toFixed(0)}%
            </p>
          </div>
          <div className="p-3 xs:p-4">
            <p className="text-xs xs:text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Thời gian
            </p>
            <p className="text-2xl xs:text-3xl font-bold text-zinc-900 dark:text-white mt-1">
              {timeLabel || fmtTime(resp.timeSec)}
            </p>
          </div>
        </div>

        {onToggleDetails && (
          <button
            onClick={onToggleDetails}
            className={`
              mt-4 xs:mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl
              px-4 xs:px-5 py-2.5 xs:py-3 text-sm xs:text-base font-semibold transition-all
              ${
                showDetails
                  ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  : "bg-zinc-900 text-white hover:bg-zinc-800 shadow-md"
              }
            `}
          >
            {showDetails ? (
              <>
                <ChevronUp className="h-4 w-4 xs:h-5 xs:w-5" />
                Ẩn chi tiết đáp án
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 xs:h-5 xs:w-5" />
                Xem chi tiết đáp án
              </>
            )}
          </button>
        )}
      </section>

      {/* 3. PHÂN TÍCH THEO PART */}
      {partsSorted.length > 0 && (
        <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 p-4 xs:p-5 md:p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">
          {/* Header */}
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2.5 xs:gap-3 mb-4 xs:mb-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 xs:p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Target className="w-4 h-4 xs:w-5 xs:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-base xs:text-lg font-bold text-zinc-900 dark:text-white">
                Phân tích theo Part
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] xs:text-xs text-zinc-500 dark:text-zinc-400">
              <Timer className="w-4 h-4" />
              <span>Mini test - 55 câu - 35 phút</span>
            </div>
          </div>

          {/* Grid Parts */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4">
            {partsSorted.map(([partKey, stat]) => {
              const lv = recommendLevel(stat.acc);
              const lastAcc = Math.round(stat.acc * 100);
              const isFinite = Number.isFinite(lastAcc);

              const levelConfig = {
                1: {
                  bg: "bg-amber-100 dark:bg-amber-900/30",
                  border: "border-amber-300 dark:border-amber-700",
                  text: "text-amber-800 dark:text-amber-300",
                  icon: "text-amber-600 dark:text-amber-400",
                },
                2: {
                  bg: "bg-sky-100 dark:bg-sky-900/30",
                  border: "border-sky-300 dark:border-sky-700",
                  text: "text-sky-800 dark:text-sky-300",
                  icon: "text-sky-600 dark:text-sky-400",
                },
                3: {
                  bg: "bg-violet-100 dark:bg-violet-900/30",
                  border: "border-violet-300 dark:border-violet-700",
                  text: "text-violet-800 dark:text-violet-300",
                  icon: "text-violet-600 dark:text-violet-400",
                },
              } as const;

              const config = (lv && (levelConfig as any)[lv]) || null;

              return (
                <div
                  key={partKey}
                  className="group rounded-xl border border-zinc-200/70 dark:border-zinc-700/70 p-3.5 xs:p-4 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900/50 dark:to-zinc-800/30 
                       shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-default"
                >
                  {/* Part Name + Level Badge */}
                  <div className="flex items-center justify-between mb-2.5 xs:mb-3">
                    <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {partLabel(partKey)}
                    </h4>
                    {config ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] xs:text-xs font-bold border ${config.bg} ${config.border} ${config.text}`}
                      >
                        <Zap className={`w-3 h-3 ${config.icon}`} />
                        Level {lv}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </div>

                  {/* Accuracy Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] xs:text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Lần gần nhất
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {isFinite ? `${lastAcc}%` : "—"}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFinite
                            ? lastAcc >= 80
                              ? "bg-emerald-500"
                              : lastAcc >= 60
                              ? "bg-sky-500"
                              : "bg-amber-500"
                            : "bg-zinc-400"
                        }`}
                        style={{ width: isFinite ? `${Math.min(lastAcc, 100)}%` : "0%" }}
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-3 xs:mt-4">
                    <Link
                      href={
                        lv
                          ? buildPracticeHref(locale, partKey, lv)
                          : `/${locale}/practice/${encodeURIComponent(partKey)}`
                      }
                      className="group/btn inline-flex items-center gap-1.5 xs:gap-2 px-3 xs:px-3.5 py-1.5 xs:py-2 rounded-lg bg-gradient-to-r from-zinc-700 to-zinc-700 
                     hover:from-zinc-700 hover:to-zinc-600 text-white text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
                    >
                      Luyện ngay
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gợi ý ưu tiên */}
          <div className="mt-5 xs:mt-6 p-3.5 xs:p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/70 dark:border-amber-800/70">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 xs:w-5 xs:h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-[12px] xs:text-sm font-medium text-amber-800 dark:text-amber-300">
                {resp.weakParts?.length ? (
                  <>
                    Ưu tiên luyện tập:{" "}
                    <strong className="font-bold">
                      {resp.weakParts.map(partLabel).join(", ")}
                    </strong>
                  </>
                ) : (
                  "Nhịp độ ổn định! Tiếp tục duy trì đều đặn."
                )}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}