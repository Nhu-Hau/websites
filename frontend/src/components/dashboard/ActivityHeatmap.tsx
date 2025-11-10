// frontend/src/components/dashboard/ActivityHeatmap.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Calendar, Flame } from "lucide-react";

interface ActivityData {
  date: string; // YYYY-MM-DD (local)
  count: number; // số bài làm trong ngày
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

/* =========================
   BẬT/TẮT FAKE DỮ LIỆU TẠI ĐÂY
   ========================= */
const USE_FAKE_ACTIVITY = true;

/* =========================
   TẠO DỮ LIỆU GIẢ
   ========================= */
function buildFakeActivity(days = 365): ActivityResponse {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activityData: ActivityData[] = [];
  let totalAttempts = 0;
  let totalDays = 0;
  let maxStreak = 0;
  let runningStreak = 0;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;

    // 🔹 Mặc định không học (0 bài)
    let count = 0;

    // 🔹 30 ngày gần nhất: random 0–10 bài/ngày
    if (i < 30) {
      count = Math.floor(Math.random() * 11); // 0–10
    }

    activityData.push({ date: dateStr, count });

    // Thống kê streak và tổng
    totalAttempts += count;
    if (count > 0) {
      totalDays += 1;
      runningStreak += 1;
      maxStreak = Math.max(maxStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  }

  // 🔹 Tính chuỗi học hiện tại (ngày liên tiếp gần nhất >0)
  let currentStreak = 0;
  for (let i = activityData.length - 1; i >= 0; i--) {
    if (activityData[i].count > 0) currentStreak++;
    else break;
  }

  return {
    activityData,
    stats: {
      totalDays,
      totalAttempts,
      currentStreak,
      maxStreak,
    },
  };
}

export default function ActivityHeatmap() {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (USE_FAKE_ACTIVITY) {
        const fake = buildFakeActivity(365); // có thể đổi 90/180/365
        if (!cancelled) {
          setData(fake);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch("/api/dashboard/activity", {
          credentials: "include",
          cache: "no-store",
        });
        const json: ActivityResponse = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        console.error("Failed to fetch activity data", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <CardWrap>
        <Header />
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Đang tải dữ liệu...
          </div>
        </div>
      </CardWrap>
    );
  }

  if (!data || data.activityData.length === 0) {
    return (
      <CardWrap>
        <Header />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Chưa có dữ liệu hoạt động
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              Hãy làm bài để theo dõi tiến trình học tập!
            </p>
          </div>
        </div>
      </CardWrap>
    );
  }

  // Map lookup theo YYYY-MM-DD
  const activityMap = new Map<string, number>();
  data.activityData.forEach((it) => activityMap.set(it.date, it.count));

  // Sinh 365 ngày gần nhất (local date, tránh lệch UTC)
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
  const maxCount = Math.max(1, ...data.activityData.map((d) => d.count));

  const getColor = (count: number) => {
    if (count === 0) return "bg-zinc-100 dark:bg-zinc-800";
    const intensity = count / maxCount;
    if (intensity < 0.25) return "bg-blue-200 dark:bg-blue-900/40";
    if (intensity < 0.5) return "bg-blue-300 dark:bg-blue-800/50";
    if (intensity < 0.75) return "bg-blue-400 dark:bg-blue-700/60";
    return "bg-blue-500 dark:bg-blue-600/70";
  };

  // Nhóm theo tuần
  const weeks: Array<Array<{ date: Date; count: number } | null>> = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  if (weeks[0] && weeks[0].length < 7) {
    const missing = 7 - weeks[0].length;
    weeks[0] = [...Array(missing).fill(null), ...weeks[0]];
  }

  const stats = data.stats;

  return (
    <CardWrap>
      <Header />

      {/* Heatmap */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => {
                if (!day) return <div key={di} className="w-3 h-3" />;
                return (
                  <div
                    key={di}
                    className={`w-3 h-3 rounded-sm ${getColor(
                      day.count
                    )} transition-all hover:scale-125 hover:ring-2 hover:ring-blue-400 dark:hover:ring-blue-500 cursor-pointer`}
                    title={`${day.date.toLocaleDateString("vi-VN")}: ${
                      day.count
                    } bài`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Stats + Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-zinc-700 dark:text-zinc-300">
              Chuỗi học hiện tại:{" "}
              <span className="font-semibold">{stats.currentStreak} ngày</span>
            </span>
          </div>
          <div className="text-zinc-600 dark:text-zinc-400">
            Tổng: <span className="font-semibold">{stats.totalDays} ngày</span>{" "}
            - <span className="font-semibold">{stats.totalAttempts} lần</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>Ít hơn</span>
          <div className="flex gap-0.5">
            <div className="w-3 h-3 rounded-sm bg-zinc-100 dark:bg-zinc-800" />
            <div className="w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-900/40" />
            <div className="w-3 h-3 rounded-sm bg-blue-300 dark:bg-blue-800/50" />
            <div className="w-3 h-3 rounded-sm bg-blue-400 dark:bg-blue-700/60" />
            <div className="w-3 h-3 rounded-sm bg-blue-500 dark:bg-blue-600/70" />
          </div>
          <span>Nhiều hơn</span>
        </div>
      </div>

      {/* Streak banner */}
      {stats.currentStreak > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800/50">
          <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
            🔥 Bạn đã duy trì chuỗi học {stats.currentStreak} ngày liên tiếp!
          </p>
        </div>
      )}
    </CardWrap>
  );
}

/* ========== UI nhỏ gọn ========== */
function CardWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 p-6 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">
      {children}
    </div>
  );
}
function Header() {
  return (
    <div className="flex items-center gap-2.5 mb-6">
      <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20">
        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
      <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
        Biểu đồ hoạt động học tập
      </h2>
    </div>
  );
}

