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
  if (
    !initialData ||
    !initialData.activityData ||
    initialData.activityData.length === 0
  ) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
            <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
              Biểu đồ hoạt động học tập
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Theo dõi thói quen học hàng ngày
            </p>
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
          </div>
          <p className="text-sm font-medium text-zinc-900 dark:text-white mb-1">
            Chưa có dữ liệu hoạt động
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Hãy làm bài để theo dõi tiến trình học tập!
          </p>
        </div>
      </div>
    );
  }

  // Map lookup theo YYYY-MM-DD
  const activityMap = new Map<string, number>();
  initialData.activityData.forEach((it) => activityMap.set(it.date, it.count));

  // Sinh 365 ngày gần nhất (local date)
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

  // Max để normalize màu
  const maxCount = Math.max(1, ...initialData.activityData.map((d) => d.count));

  const getColor = (count: number) => {
    if (count === 0) return "bg-zinc-100 dark:bg-zinc-800";
    const intensity = count / maxCount;
    if (intensity < 0.25) return "bg-emerald-200 dark:bg-emerald-900/40";
    if (intensity < 0.5) return "bg-emerald-300 dark:bg-emerald-800/50";
    if (intensity < 0.75) return "bg-emerald-400 dark:bg-emerald-700/60";
    return "bg-emerald-500 dark:bg-emerald-600/70";
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
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
          <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
            Biểu đồ hoạt động học tập
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Theo dõi thói quen học hàng ngày
          </p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max p-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => {
                if (!day) return <div key={di} className="w-3 h-3" />;
                return (
                  <div
                    key={di}
                    className={`w-3 h-3 rounded ${getColor(day.count)} transition-colors hover:ring-1 hover:ring-emerald-400 cursor-pointer`}
                    title={`${day.date.toLocaleDateString("vi-VN")}: ${day.count} bài`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Stats + Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20">
              <Flame className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                {stats.currentStreak} ngày
              </span>
              <span className="text-xs text-zinc-600 dark:text-zinc-400 ml-1">
                chuỗi hiện tại
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <Trophy className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span>
              <span className="font-medium">{stats.totalDays}</span> ngày •{" "}
              <span className="font-medium">{stats.totalAttempts}</span> lần
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>Ít</span>
          <div className="flex gap-0.5">
            <div className="w-3 h-3 rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="w-3 h-3 rounded bg-emerald-200 dark:bg-emerald-900/40" />
            <div className="w-3 h-3 rounded bg-emerald-300 dark:bg-emerald-800/50" />
            <div className="w-3 h-3 rounded bg-emerald-400 dark:bg-emerald-700/60" />
            <div className="w-3 h-3 rounded bg-emerald-500 dark:bg-emerald-600/70" />
          </div>
          <span>Nhiều</span>
        </div>
      </div>

      {/* Streak banner */}
      {stats.currentStreak > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300 text-center">
            Bạn đã duy trì chuỗi học{" "}
            <span className="font-semibold">{stats.currentStreak}</span> ngày liên tiếp!
          </p>
        </div>
      )}
    </div>
  );
}