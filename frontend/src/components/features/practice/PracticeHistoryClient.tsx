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
} from "lucide-react";

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
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
    : level === 2
    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
    : "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300";
}

export default function PracticeHistoryClient({
  items,
  total,
  page,
  limit,
}: PracticeHistoryClientProps) {
  const base = useBasePrefix("vi");
  const hasData = items.length > 0;
  const locale = base.slice(1) || "vi";

  return (
    <div className="mx-auto max-w-[1350px] px-6 py-10 mt-16 ">
      <header className="mb-10 space-y-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Lịch sử luyện tập
            </h1>
            <p className="text-base text-zinc-600 dark:text-zinc-400 mt-1">
              Theo dõi tiến trình, xem lại kết quả và cải thiện từng ngày.
            </p>
          </div>
        </div>

        {hasData && (
          <div className="flex flex-wrap gap-5 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                <strong className="text-zinc-900 dark:text-white">
                  {items.reduce((s, a) => s + a.correct, 0)}
                </strong>{" "}
                câu đúng
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
              <span>
                Trung bình:{" "}
                <strong className="text-zinc-900 dark:text-white">
                  {Math.round(
                    (items.reduce((s, a) => s + a.acc, 0) / items.length) * 100
                  )}
                  %
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
              <span>
                Tổng thời gian:{" "}
                <strong className="text-zinc-900 dark:text-white">
                  {fmtTime(items.reduce((s, a) => s + a.timeSec, 0))}
                </strong>
              </span>
            </div>
          </div>
        )}
      </header>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 rounded-full bg-zinc-100 dark:bg-zinc-800 p-8">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-zinc-700 dark:to-zinc-600" />
          </div>
          <h3 className="text-xl font-semibold text-zinc-700 dark:text-zinc-300">
            Chưa có lịch sử
          </h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
            Bạn chưa làm bài nào. Hãy vào phần luyện tập và bắt đầu ngay hôm
            nay!
          </p>
          <Link
            href={`${base}/practice`}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
          >
            Bắt đầu luyện tập <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
              Các bài đã làm
            </h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {total} bài • Trang {page}
            </span>
          </div>

          <div className="space-y-3">
            {items.map((a) => {
              const at = a.submittedAt || a.createdAt;
              const accPct = Math.round((a.acc ?? 0) * 100);
              const isPerfect = accPct === 100;
              return (
                <Link
                  key={a._id}
                  href={`${base}/practice/history/${encodeURIComponent(a._id)}`}
                  className={`
                  group block rounded-2xl border border-zinc-200/70 dark:border-zinc-700/70
                  bg-white/80 dark:bg-zinc-800/70 backdrop-blur-xl
                  px-4 py-3 sm:px-5 sm:py-3
                  shadow-sm hover:shadow-xl hover:scale-[1.01]
                  transition-all duration-300 ease-out
                  ${
                    isPerfect
                      ? "ring-2 ring-emerald-500/30 dark:ring-emerald-400/30"
                      : ""
                  }
                `}
                >
                  <div className="flex flex-nowrap items-center justify-between gap-4">
                    <div className="min-w-0 flex items-center gap-4">
                      {/* Title + Trophy */}
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="truncate text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                          {String(a.partKey).replace("part.", "Part ")}
                          {typeof a.test === "number" && ` – Test ${a.test}`}
                        </h3>
                        {isPerfect && (
                          <Trophy className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </div>

                      {/* Badge strip */}
                      <div
                        className="
                        flex flex-nowrap items-center gap-2 text-xs
                        overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
                      "
                      >
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-semibold
                          ${getAccuracyColor(
                            a.acc
                          )} bg-white/70 dark:bg-zinc-700/50 border-zinc-300 dark:border-zinc-600`}
                        >
                          <ListChecks className="h-4 w-4" /> {a.correct}/
                          {a.total} ({accPct}%)
                        </span>

                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 px-2.5 py-1 font-medium text-zinc-700 dark:text-zinc-300 bg-white/70 dark:bg-zinc-700/50">
                          <Timer className="h-4 w-4" /> {fmtTime(a.timeSec)}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-medium ${getLevelColor(
                            a.level
                          )} bg-opacity-80`}
                        >
                          <Layers className="h-4 w-4" /> Level {a.level}
                        </span>

                        {typeof a.test === "number" && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 px-2.5 py-1 font-medium text-zinc-700 dark:text-zinc-300 bg-white/70 dark:bg-zinc-700/50">
                            <Hash className="h-4 w-4" /> Test {a.test}
                          </span>
                        )}

                        {at && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 px-2.5 py-1 font-medium text-zinc-600 dark:text-zinc-400 bg-white/70 dark:bg-zinc-700/50">
                            <CalendarClock className="h-3.5 w-3.5" />
                            <time dateTime={at} className="whitespace-nowrap">
                              {new Date(at).toLocaleString(locale, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </time>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Xem chi tiết
                      </span>
                      <ChevronRight className="h-5 w-5 text-zinc-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {total > items.length && (
            <div className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Hiển thị {items.length} trong {total} bài • Trang {page}
            </div>
          )}
        </div>
      )}
    </div>
  );
}







