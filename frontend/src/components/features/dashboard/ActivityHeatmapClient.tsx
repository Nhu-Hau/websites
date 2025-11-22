"use client";

import React from "react";
import { Calendar, Flame, Trophy } from "lucide-react";

interface ActivityData {
  date: string;
  count: number;
}

interface ActivityStats {
  totalDays: number;
  totalAttempts: number;
  currentStreak: number;
  maxStreak: number;
}

interface ActivityResponse {
  activityData: ActivityData[];
  stats: ActivityStats;
}

interface ActivityHeatmapClientProps {
  initialData: ActivityResponse | null;
}

export default function ActivityHeatmapClient({
  initialData,
}: ActivityHeatmapClientProps) {
  /* ================= EMPTY STATE ================= */
  if (
    !initialData ||
    !initialData.activityData ||
    initialData.activityData.length === 0
  ) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white/95 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-xl transition-all hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/95 sm:p-5">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800" />

        <div className="mb-5 flex gap-3 sm:mb-6 items-center">
          {/* Icon gradient kiểu planner */}
          <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl sm:h-10 sm:w-10">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-200/60 via-blue-200/40 to-indigo-300/40 blur-xl" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-md shadow-[#00000022] sm:h-10 sm:w-10">
              <Calendar className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-xl">
              Biểu đồ hoạt động học tập
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 sm:text-[13px]">
              Theo dõi thói quen học hằng ngày của bạn.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200/80 bg-gray-50/70 px-5 py-8 text-center dark:border-gray-700/70 dark:bg-gray-900/60 sm:px-10 sm:py-10">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-white shadow-sm dark:bg-gray-900 sm:mb-5 sm:h-16 sm:w-16">
            <Calendar className="h-7 w-7 text-gray-400 dark:text-gray-500 sm:h-8 sm:w-8" />
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 sm:text-base">
            Chưa có dữ liệu hoạt động
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
            Hãy làm bài luyện tập hoặc bài test để hệ thống vẽ heatmap cho bạn.
          </p>
        </div>
      </div>
    );
  }

  /* ================= CÓ DỮ LIỆU ================= */

  const activityMap = new Map<string, number>();
  initialData.activityData.forEach((it) => activityMap.set(it.date, it.count));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 🔹 Lấy đúng 12 tháng (1 năm)
  const TOTAL_DAYS = 52 * 7; // 364 ngày

  const days: Array<{ date: Date; count: number }> = [];
  for (let i = TOTAL_DAYS - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    days.push({ date, count: activityMap.get(dateStr) || 0 });
  }

  const maxCount = Math.max(1, ...initialData.activityData.map((d) => d.count));

  const getColor = (count: number) => {
    if (count === 0)
      return "bg-gray-100 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60";

    const intensity = count / maxCount;

    if (intensity < 0.25)
      return "bg-blue-100 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-900/60";

    if (intensity < 0.5)
      return "bg-blue-200 dark:bg-blue-900/70 border border-blue-300/80 dark:border-blue-800/80";

    if (intensity < 0.75)
      return "bg-blue-300 dark:bg-blue-800/80 border border-blue-400/90 dark:border-blue-700/90";

    return "bg-blue-500 dark:bg-blue-700 border border-blue-600 dark:border-blue-600";
  };

  const weeks: Array<Array<{ date: Date; count: number } | null>> = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  if (weeks[0] && weeks[0].length < 7) {
    const missing = 7 - weeks[0].length;
    weeks[0] = [...Array(missing).fill(null), ...weeks[0]];
  }

  const stats = initialData.stats;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white/95 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-xl transition-all hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/95 sm:p-5">
      {/* accent line */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800" />
      {/* HEADER */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {/* Icon gradient kiểu planner */}
          <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl sm:h-10 sm:w-10">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-200/60 via-blue-200/40 to-indigo-300/40 blur-xl" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-md shadow-[#00000022] sm:h-10 sm:w-10">
              <Calendar className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-xl">
              Biểu đồ hoạt động học tập
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 sm:text-[13px]">
              Mỗi ô vuông là một ngày – màu càng đậm, bạn học càng chăm chỉ.
            </p>
          </div>
        </div>

        {/* Stats header */}
        <div className="flex flex-col items-start gap-1 rounded-xl bg-gray-50/80 px-3 py-2 text-xs text-gray-600 dark:bg-gray-900/70 dark:text-gray-300 sm:items-end sm:text-right">
          <div>
            Tổng ngày học:{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {stats.totalDays}
            </span>
          </div>
          <div className="text-[11px] sm:text-xs">
            Tổng lượt làm bài:{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {stats.totalAttempts}
            </span>
          </div>
        </div>
      </div>

      {/* HEATMAP – đã thu nhỏ */}
      <div className="mb-5 overflow-x-auto sm:mb-6">
        <div className="min-w-max rounded-xl border border-gray-200/80 bg-gray-50/60 px-2.5 py-2.5 dark:border-gray-700/80 dark:bg-gray-900/70 sm:px-3 sm:py-3">
          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => {
                  if (!day)
                    return (
                      <div
                        key={di}
                        className="h-2.5 w-2.5 rounded-[4px] sm:h-3 sm:w-3 md:h-3.5 md:w-3.5"
                      />
                    );

                  return (
                    <div
                      key={di}
                      className={`h-2.5 w-2.5 rounded-[4px] sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 transition-all duration-200 hover:scale-125 hover:ring-2 hover:ring-blue-600/50 hover:shadow-lg ${getColor(
                        day.count
                      )}`}
                      title={`${day.date.toLocaleDateString("vi-VN")}: ${
                        day.count
                      } lượt`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER STATS + LEGEND */}
      <div className="flex flex-col gap-4 border-t border-gray-200/70 pt-4 text-xs dark:border-gray-800/70 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:pt-5">
        {/* Streaks */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            {/* Icon gradient kiểu planner */}
            <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl sm:h-10 sm:w-10">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-200/60 via-orange-200/40 to-red-300/40 blur-xl" />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-md shadow-[#00000022] sm:h-10 sm:w-10">
                <Flame className="h-4 w-4 text-white sm:h-5 sm:w-5" />
              </div>
            </div>
            <div>
              <p className="text-base font-bold text-blue-700 dark:text-blue-400 sm:text-lg">
                {stats.currentStreak}
              </p>
              <p className="text-[11px] font-medium text-gray-600 dark:text-gray-400 sm:text-xs">
                Chuỗi hiện tại
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Icon gradient kiểu planner */}
            <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl sm:h-10 sm:w-10">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-200/60 via-amber-200/40 to-yellow-300/40 blur-xl" />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-md shadow-[#00000022] sm:h-10 sm:w-10">
                <Trophy className="h-4 w-4 text-white sm:h-5 sm:w-5" />
              </div>
            </div>
            <div>
              <p className="text-base font-bold text-gray-800 dark:text-gray-200 sm:text-lg">
                {stats.maxStreak}
              </p>
              <p className="text-[11px] font-medium text-gray-600 dark:text-gray-400 sm:text-xs">
                Chuỗi dài nhất
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 sm:text-xs">
          <span>Ít</span>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-[4px] bg-gray-100 dark:bg-gray-800 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5" />
            <div className="h-2.5 w-2.5 rounded-[4px] bg-blue-100 dark:bg-blue-950/50 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5" />
            <div className="h-2.5 w-2.5 rounded-[4px] bg-blue-200 dark:bg-blue-900/70 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5" />
            <div className="h-2.5 w-2.5 rounded-[4px] bg-blue-300 dark:bg-blue-800/80 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5" />
            <div className="h-2.5 w-2.5 rounded-[4px] bg-blue-500 dark:bg-blue-700 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5" />
          </div>
          <span>Nhiều</span>
        </div>
      </div>

      {/* MOTIVATION BANNER */}
      {stats.currentStreak > 0 && (
        <div className="mt-4 rounded-xl border border-blue-700/25 bg-gradient-to-r from-blue-700/8 via-blue-600/8 to-indigo-600/8 px-4 py-3 text-center sm:mt-5 sm:px-5">
          <p className="text-[10px] font-semibold text-blue-800 dark:text-blue-300 sm:text-sm">
            Bạn đang duy trì chuỗi học{" "}
            <span className="text-lg font-bold text-blue-700 dark:text-blue-400 sm:text-xl">
              {stats.currentStreak}
            </span>{" "}
            ngày liên tiếp 🔥 Tiếp tục giữ vững nhé!
          </p>
        </div>
      )}
    </div>
  );
}
