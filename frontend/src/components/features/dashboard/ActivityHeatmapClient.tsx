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
  /* ================== Empty state ================== */
  if (
    !initialData ||
    !initialData.activityData ||
    initialData.activityData.length === 0
  ) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/92 p-5 shadow-sm ring-1 ring-black/[0.03] transition-all duration-200 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/92">
        {/* BLUE header */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600" />

        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-blue-200/40 blur-md dark:bg-blue-500/25" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Biểu đồ hoạt động học tập
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Theo dõi thói quen học hằng ngày của bạn.
            </p>
          </div>
        </div>

        {/* Empty Box */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-7 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800">
            <Calendar className="h-7 w-7 text-zinc-400 dark:text-zinc-500" />
          </div>
          <p className="mb-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Chưa có dữ liệu hoạt động
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Hãy làm bài luyện tập hoặc bài test để hệ thống vẽ heatmap cho bạn.
          </p>
        </div>
      </div>
    );
  }

  /* ================== Có dữ liệu ================== */

  const activityMap = new Map<string, number>();
  initialData.activityData.forEach((it) => activityMap.set(it.date, it.count));

  // 365 ngày gần nhất
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: Array<{ date: Date; count: number }> = [];
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    days.push({ date, count: activityMap.get(dateStr) || 0 });
  }

  // max để normalize
  const maxCount = Math.max(1, ...initialData.activityData.map((d) => d.count));

  /* ================== BLUE HEATMAP COLORS ================== */
  const getColor = (count: number) => {
    if (count === 0)
      return "bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-100/60 dark:border-zinc-700/70";

    const intensity = count / maxCount;

    if (intensity < 0.25)
      return "bg-blue-100/90 dark:bg-blue-950/40 border border-blue-100/70 dark:border-blue-900/60";

    if (intensity < 0.5)
      return "bg-blue-200/90 dark:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800/80";

    if (intensity < 0.75)
      return "bg-blue-300/95 dark:bg-blue-800/70 border border-blue-300/90 dark:border-blue-700/90";

    return "bg-blue-400/95 dark:bg-blue-700/80 border border-blue-400/95 dark:border-blue-600/90";
  };

  // Nhóm theo tuần
  const weeks: Array<Array<{ date: Date; count: number } | null>> = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  if (weeks[0] && weeks[0].length < 7) {
    const missing = 7 - weeks[0].length;
    weeks[0] = [...Array(missing).fill(null), ...weeks[0]];
  }

  const stats = initialData.stats;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/92 p-5 shadow-sm ring-1 ring-black/[0.03] transition-all duration-200 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/92">
      {/* BLUE header line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600" />

      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-blue-200/40 blur-md dark:bg-blue-500/25" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Biểu đồ hoạt động học tập
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Mỗi ô vuông là một ngày – màu càng đậm, bạn học càng nhiều.
            </p>
          </div>
        </div>

        <div className="hidden text-[11px] text-zinc-500 dark:text-zinc-400 sm:flex sm:flex-col sm:items-end">
          <span>
            Tổng ngày học:{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {stats.totalDays}
            </span>
          </span>
          <span>
            Tổng lượt làm bài:{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {stats.totalAttempts}
            </span>
          </span>
        </div>
      </div>

      {/* Heatmap */}
      <div className="mb-5 overflow-x-auto">
        <div className="min-w-max rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3 dark:border-zinc-700/80 dark:bg-zinc-900/80">
          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => {
                  if (!day)
                    return <div key={di} className="h-3.5 w-3.5 rounded-[5px]" />;

                  return (
                    <div
                      key={di}
                      className={`h-3.5 w-3.5 rounded-[5px] transition-all duration-150 hover:scale-105 hover:ring-1 hover:ring-blue-400/80 ${getColor(
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

      {/* Stats + Legend */}
      <div className="flex flex-col gap-4 border-t border-zinc-200/80 pt-4 text-xs sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800/80">
        <div className="flex flex-wrap items-center gap-4">
          {/* Current streak */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/25">
              <Flame className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                {stats.currentStreak} ngày
              </p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Chuỗi hiện tại
              </p>
            </div>
          </div>

          {/* Max streak */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <Trophy className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                {stats.maxStreak} ngày
              </p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Chuỗi dài nhất
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span>Ít</span>
          <div className="flex gap-1">
            <div className="h-3.5 w-3.5 rounded-[5px] bg-zinc-100/90 dark:bg-zinc-800/80" />
            <div className="h-3.5 w-3.5 rounded-[5px] bg-blue-100/90 dark:bg-blue-950/40" />
            <div className="h-3.5 w-3.5 rounded-[5px] bg-blue-200/90 dark:bg-blue-900/60" />
            <div className="h-3.5 w-3.5 rounded-[5px] bg-blue-300/95 dark:bg-blue-800/70" />
            <div className="h-3.5 w-3.5 rounded-[5px] bg-blue-400/95 dark:bg-blue-700/80" />
          </div>
          <span>Nhiều</span>
        </div>
      </div>

      {/* Streak banner */}
      {stats.currentStreak > 0 && (
        <div className="mt-3 rounded-xl border border-blue-200/80 bg-blue-50/80 px-4 py-2.5 text-center text-[11px] font-medium text-blue-800 dark:border-blue-800/80 dark:bg-blue-900/20 dark:text-blue-200">
          Bạn đang duy trì chuỗi học{" "}
          <span className="font-semibold">{stats.currentStreak}</span> ngày liên
          tiếp. Tiếp tục nhé!
        </div>
      )}
    </div>
  );
}