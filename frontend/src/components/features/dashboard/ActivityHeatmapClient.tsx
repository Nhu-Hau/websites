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
      <CardWrap>
        <Header />
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-zinc-800 dark:to-zinc-700 shadow-inner flex items-center justify-center mb-6">
            <Calendar className="h-12 w-12 text-slate-400 dark:text-zinc-500" />
          </div>
          <p className="text-lg font-black text-zinc-700 dark:text-zinc-300 mb-2">
            Chưa có dữ liệu hoạt động
          </p>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-8">
            Hãy làm bài để theo dõi tiến trình học tập!
          </p>
        </div>
      </CardWrap>
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
    if (count === 0) return "bg-zinc-200 dark:bg-zinc-800";
    const intensity = count / maxCount;
    if (intensity < 0.25) return "bg-emerald-200 dark:bg-emerald-900/50";
    if (intensity < 0.5) return "bg-emerald-300 dark:bg-emerald-800/60";
    if (intensity < 0.75) return "bg-emerald-400 dark:bg-emerald-700/70";
    return "bg-emerald-500 dark:bg-emerald-600/80";
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
    <CardWrap>
      <Header />

      {/* Heatmap */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex gap-1.5 min-w-max p-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1.5">
              {week.map((day, di) => {
                if (!day) return <div key={di} className="w-4 h-4" />;
                return (
                  <div
                    key={di}
                    className={`group relative w-4 h-4 rounded-md ${getColor(
                      day.count
                    )} transition-all duration-200 hover:scale-150 hover:shadow-lg hover:ring-2 hover:ring-emerald-500 dark:hover:ring-emerald-400 cursor-pointer`}
                    title={`${day.date.toLocaleDateString("vi-VN")}: ${
                      day.count
                    } bài`}
                  ></div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Stats + Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-5 text-base">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg ring-2 ring-white/50">
              <Flame className="h-5 w-5 text-white drop-shadow-md" />
            </div>
            <div>
              <span className="font-black text-zinc-800 dark:text-zinc-200">
                {stats.currentStreak} ngày
              </span>
              <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400 ml-1">
                chuỗi hiện tại
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm font-bold text-zinc-600 dark:text-zinc-400">
            <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>{stats.totalDays}</strong> ngày •{" "}
              <strong>{stats.totalAttempts}</strong> lần
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400">
          <span>Ít</span>
          <div className="flex gap-0.5">
            <div className="w-4 h-4 rounded-md bg-zinc-100 dark:bg-zinc-800" />
            <div className="w-4 h-4 rounded-md bg-emerald-200 dark:bg-emerald-900/50" />
            <div className="w-4 h-4 rounded-md bg-emerald-300 dark:bg-emerald-800/60" />
            <div className="w-4 h-4 rounded-md bg-emerald-400 dark:bg-emerald-700/70" />
            <div className="w-4 h-4 rounded-md bg-emerald-500 dark:bg-emerald-600/80" />
          </div>
          <span>Nhiều</span>
        </div>
      </div>

      {/* Streak banner */}
      {stats.currentStreak > 0 && (
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 shadow-inner border border-amber-200/50 dark:border-amber-800/40">
          <p className="text-sm font-black text-amber-800 dark:text-amber-300 text-center">
            Bạn đã duy trì chuỗi học{" "}
            <span className="text-sm">{stats.currentStreak}</span> ngày liên
            tiếp!
          </p>
        </div>
      )}
    </CardWrap>
  );
}

function CardWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="group relative rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl p-6 shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50 transition-all duration-500 hover:shadow-3xl hover:scale-[1.005] hover:ring-amber-100/50 dark:hover:ring-amber-600/50 overflow-hidden">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">{children}</div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="relative transform-gpu transition-all duration-400 group-hover:scale-110 group-hover:-rotate-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl ring-3 ring-white/50 dark:ring-zinc-800/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/30 backdrop-blur-md">
              <Calendar className="h-7 w-7 text-white drop-shadow-md" />
            </div>
          </div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/40 to-teal-400/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
            Biểu đồ hoạt động học tập
          </h2>
          <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
            Theo dõi thói quen học hàng ngày
          </p>
        </div>
      </div>
    </div>
  );
}
