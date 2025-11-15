/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";

/* ===================== Types ===================== */
type Lvl = 1 | 2 | 3;
type PartKey =
  | "part.1"
  | "part.2"
  | "part.3"
  | "part.4"
  | "part.5"
  | "part.6"
  | "part.7";

type PracticeAttemptDoc = {
  _id: string;
  partKey: string;
  level: 1 | 2 | 3;
  test?: number | null;
  total: number;
  correct: number;
  acc: number; // 0..1
  timeSec: number;
  createdAt?: string;
  submittedAt?: string;
  isRetake?: boolean;
};

/* ===================== Constants ===================== */
const PARTS: PartKey[] = [
  "part.1",
  "part.2",
  "part.3",
  "part.4",
  "part.5",
  "part.6",
  "part.7",
];

const PART_LABEL: Record<PartKey, string> = {
  "part.1": "Part 1",
  "part.2": "Part 2",
  "part.3": "Part 3",
  "part.4": "Part 4",
  "part.5": "Part 5",
  "part.6": "Part 6",
  "part.7": "Part 7",
};

function fmtTimeLabel(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(
    2,
    "0"
  )}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/* ===================== Component ===================== */
export default function PracticeProgressChart() {
  const [practiceHist, setPracticeHist] = React.useState<PracticeAttemptDoc[]>(
    []
  );
  const [selectedPart, setSelectedPart] = React.useState<PartKey>("part.1");
  const [loading, setLoading] = React.useState(true);

  /* ====== Fetcher ====== */
  const fetchPracticeHist = React.useCallback(async () => {
    const rPh = await fetch("/api/practice/history?limit=200", {
      credentials: "include",
      cache: "no-store",
    });
    const jPh: {
      page: number;
      limit: number;
      total: number;
      items: PracticeAttemptDoc[];
    } = rPh.ok
      ? await rPh.json()
      : { page: 1, limit: 200, total: 0, items: [] };
    setPracticeHist(jPh.items || []);
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        await fetchPracticeHist();
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const onVis = () => {
      if (document.visibilityState === "visible") {
        fetchPracticeHist();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    const onPracticeUpdated = () => {
      fetchPracticeHist();
    };
    window.addEventListener("practice:updated", onPracticeUpdated as any);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("practice:updated", onPracticeUpdated as any);
      mounted = false;
    };
  }, [fetchPracticeHist]);

  /* ---------- Line theo từng Part (từ practice) ---------- */
  const lineByPart = React.useMemo(() => {
    const map: Record<
      PartKey,
      {
        at: string;
        acc: number;
        level: Lvl;
        test?: number | null;
        movingAvg?: number;
        isRetake?: boolean;
      }[]
    > = {
      "part.1": [],
      "part.2": [],
      "part.3": [],
      "part.4": [],
      "part.5": [],
      "part.6": [],
      "part.7": [],
    };

    // Sắp xếp theo thời gian (bao gồm cả retake)
    const arr = [...practiceHist].sort((a, b) => {
      const ta = new Date(a.submittedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.submittedAt || b.createdAt || 0).getTime();
      return ta - tb;
    });

    // Tính moving average (window size = 3)
    const windowSize = 3;
    for (const p of PARTS) {
      const partData = arr.filter((a) => a.partKey === p);
      for (let i = 0; i < partData.length; i++) {
        const a = partData[i];
        const at = fmtTimeLabel(a.submittedAt || a.createdAt || "");
        const acc = Math.round((a.acc ?? 0) * 1000) / 10;

        // Tính moving average từ các điểm trước đó
        let movingAvg: number | undefined = undefined;
        if (i >= windowSize - 1) {
          const window = partData.slice(i - windowSize + 1, i + 1);
          const sum = window.reduce(
            (sum, item) => sum + (item.acc ?? 0) * 100,
            0
          );
          movingAvg = Math.round((sum / window.length) * 10) / 10;
        }

        map[p].push({
          at,
          acc,
          level: a.level as Lvl,
          test: a.test,
          movingAvg,
          isRetake: a.isRetake ?? false,
        });
      }
    }
    return map;
  }, [practiceHist]);

  const chartData = lineByPart[selectedPart] || [];

  /* ===================== Render ===================== */
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
            <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
              Tiến bộ luyện tập
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Theo dõi accuracy theo từng Part
            </p>
          </div>
        </div>
      </div>

      {/* Part Selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {PARTS.map((p) => {
          const isSel = selectedPart === p;
          return (
            <button
              key={p}
              onClick={() => setSelectedPart(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 ${
                isSel
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {PART_LABEL[p]}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="relative h-[205px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400 dark:text-zinc-500" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Đang tải dữ liệu...
            </p>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                className="dark:stroke-zinc-800"
              />
              <XAxis
                dataKey="at"
                interval="preserveStartEnd"
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={{ stroke: "#d4d4d8" }}
                tickLine={{ stroke: "#d4d4d8" }}
                minTickGap={20}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={{ stroke: "#d4d4d8" }}
                tickLine={{ stroke: "#d4d4d8" }}
                width={40}
              />
              <ChartTooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.98)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  padding: "8px 12px",
                }}
                labelStyle={{
                  color: "#18181b",
                  fontWeight: 600,
                  fontSize: 11,
                }}
                itemStyle={{ fontSize: 11, fontWeight: 500 }}
                cursor={{ stroke: "#6366f1", strokeWidth: 1 }}
                formatter={(value: number, name: string, props: any) => {
                  const payload = props.payload;
                  const level = payload?.level
                    ? ` • Level${payload.level}`
                    : "";
                  const test =
                    payload?.test != null ? ` • Test${payload.test}` : "";
                  return [
                    `${Math.round(value)}%${level}${test}`,
                    "Accuracy",
                  ];
                }}
              />
              <Line
                type="monotone"
                dataKey="acc"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: "#6366f1", strokeWidth: 2 }}
                animationDuration={400}
              />
              {chartData.some((d) => d.movingAvg != null) && (
                <Line
                  type="monotone"
                  dataKey="movingAvg"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                  activeDot={false}
                  animationDuration={400}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white mb-1">
                Chưa có dữ liệu luyện tập
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Hãy làm bài Practice để xem biểu đồ tiến bộ này
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {chartData.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-indigo-600" />
            <span>Accuracy</span>
          </div>
          {chartData.some((d) => d.movingAvg != null) && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 border-t border-dashed border-zinc-400" />
              <span>Moving Avg</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}