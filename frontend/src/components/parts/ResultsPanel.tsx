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
    <div className="space-y-6">
      {/* 1. ĐIỂM LỚN – DASHBOARD */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6 bg-white/80 dark:bg-zinc-800/70 backdrop-blur-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
              <Gauge className="h-8 w-8 text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                TOEIC
              </p>
              <p className="text-3xl font-black text-zinc-900 dark:text-white">
                {predictedOverall}
                <span className="text-lg font-bold text-zinc-500 dark:text-zinc-400">
                  {" "}
                  / 990
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6 bg-white/80 dark:bg-zinc-800/70 backdrop-blur-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800">
              <Headphones className="h-8 w-8 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Listening
              </p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {predictedL} / 495
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {(resp.listening.acc * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6 bg-white/80 dark:bg-zinc-800/70 backdrop-blur-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900 dark:to-sky-800">
              <BookOpen className="h-8 w-8 text-sky-700 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Reading
              </p>
              <p className="text-2xl font-bold text-sky-700 dark:text-sky-400">
                {predictedR} / 495
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {(resp.reading.acc * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TỔNG QUAN – ĐƠN GIẢN */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6 bg-white/80 dark:bg-zinc-800/70 backdrop-blur-xl shadow-sm">
        <h2 className="text-xl font-bold text-center text-zinc-900 dark:text-white mb-5">
          TỔNG QUAN
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Số câu đúng
            </p>
            <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-1">
              {resp.correct} / {resp.total}
            </p>
          </div>
          <div className="p-4">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Độ chính xác
            </p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {(resp.acc * 100).toFixed(0)}%
            </p>
          </div>
          <div className="p-4">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Thời gian
            </p>
            <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-1">
              {timeLabel || fmtTime(resp.timeSec)}
            </p>
          </div>
        </div>

        {onToggleDetails && (
          <button
            onClick={onToggleDetails}
            className={`
              mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl
              px-5 py-3 text-base font-semibold transition-all
              ${
                showDetails
                  ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  : "bg-zinc-900 text-white hover:bg-zinc-800 shadow-md"
              }
            `}
          >
            {showDetails ? (
              <>
                <ChevronUp className="h-5 w-5" />
                Ẩn chi tiết đáp án
              </>
            ) : (
              <>
                <ChevronDown className="h-5 w-5" />
                Xem chi tiết đáp án
              </>
            )}
          </button>
        )}
      </section>

      {/* 3. PHÂN TÍCH PART */}
      {partsSorted.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6 bg-white/80 dark:bg-zinc-800/70 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Phân tích theo Part
              </h3>
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Timer className="w-4 h-4" />
              Mini test 55 câu • 35 phút
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {partsSorted.map(([partKey, stat]) => {
              const lv = recommendLevel(stat.acc); // giống 'levels[p]'
              const lastAcc = Math.round(stat.acc * 100); // giống 'lastAccByPart[p]'

              // màu badge Level (nhẹ như ví dụ 2)
              const levelBadge =
                lv === 1
                  ? "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                  : lv === 2
                  ? "border-sky-300 bg-sky-100 text-sky-800 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-200"
                  : "border-violet-300 bg-violet-100 text-violet-800 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-200";

              return (
                <div
                  key={partKey}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 bg-zinc-50 dark:bg-zinc-800/60"
                >
                  {/* Header: tên Part + badge Level */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {partLabel(partKey)}
                    </div>

                    {lv ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${levelBadge}`}
                      >
                        Level {lv}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </div>

                  {/* Dòng “Lần gần nhất” giống block 2 */}
                  <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                    Lần gần nhất:{" "}
                    <b>{Number.isFinite(lastAcc) ? `${lastAcc}%` : "—"}</b>
                  </div>

                  {/* Nút hành động */}
                  <div className="mt-3 flex items-center gap-2">
                    <Link
                      href={
                        lv
                          ? buildPracticeHref(locale, partKey, lv)
                          : `/${locale}/practice/${encodeURIComponent(partKey)}`
                      }
                      className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-xs"
                    >
                      Luyện ngay
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* GỢI Ý */}
          <div className="mt-5 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
              {resp.weakParts?.length ? (
                <>
                  Gợi ý ưu tiên:{" "}
                  <strong>{resp.weakParts.map(partLabel).join(", ")}</strong>
                </>
              ) : (
                "Nhịp độ ổn định! Tiếp tục luyện đều."
              )}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
