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
import { BarChart3, Loader2 } from "lucide-react";

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

  /* ===================== Render ===================== */
  return (
    <section className="group relative h-full flex flex-col rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl p-6 shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50 transition-all duration-500 hover:shadow-3xl hover:scale-[1.005] hover:ring-indigo-300/50 dark:hover:ring-indigo-600/50 overflow-hidden">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative transform-gpu transition-all duration-400 group-hover:scale-110 group-hover:-rotate-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-xl ring-3 ring-white/50 dark:ring-zinc-800/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/30 backdrop-blur-md">
                  <BarChart3 className="h-7 w-7 text-white drop-shadow-md" />
                </div>
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-400/40 to-blue-400/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
                Tiến bộ luyện tập
              </h2>
              <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                Theo dõi accuracy theo từng Part
              </p>
            </div>
          </div>
        </div>

        {/* Part chips */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 flex-wrap">
            {PARTS.map((p) => {
              const isSel = selectedPart === p;
              return (
                <button
                  key={p}
                  onClick={() => setSelectedPart(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-black transition-all duration-200
                    ${
                      isSel
                        ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg"
                        : "bg-white/80 dark:bg-zinc-800/80 border-2 border-white/40 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-md hover:scale-[1.02]"
                    }`}
                >
                  {PART_LABEL[p]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart */}
        <div className="relative flex-1 min-h-[200px]">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
              <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                Đang tải dữ liệu...
              </p>
            </div>
          ) : lineByPart[selectedPart]?.length > 0 ? (
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={lineByPart[selectedPart]}
                  margin={{ top: 8, right: 12, left: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="#e5e7eb"
                    className="dark:stroke-zinc-700 opacity-50"
                  />
                  <XAxis
                    dataKey="at"
                    interval="preserveStartEnd"
                    tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: "#d1d5db" }}
                    tickLine={{ stroke: "#d1d5db" }}
                    minTickGap={20}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: "#d1d5db" }}
                    tickLine={{ stroke: "#d1d5db" }}
                    width={36}
                  />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "2px solid #e5e7eb",
                      borderRadius: "12px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      padding: "10px 14px",
                      backdropFilter: "blur(8px)",
                    }}
                    labelStyle={{
                      color: "#374151",
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                    itemStyle={{ fontSize: 12, fontWeight: 600 }}
                    cursor={{
                      stroke: "#6366f1",
                      strokeWidth: 2,
                      strokeDasharray: "6 6",
                    }}
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
                    strokeWidth={3}
                    dot={{
                      r: 5,
                      stroke: "#6366f1",
                      strokeWidth: 2,
                      fill: "#fff",
                    }}
                    activeDot={{
                      r: 7,
                      stroke: "#6366f1",
                      strokeWidth: 3,
                      fill: "#fff",
                    }}
                    animationDuration={800}
                  />
                  {lineByPart[selectedPart]?.some(
                    (d) => d.movingAvg != null
                  ) && (
                    <Line
                      type="monotone"
                      dataKey="movingAvg"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      dot={false}
                      activeDot={false}
                      animationDuration={800}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
              <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-zinc-800 dark:to-zinc-700 shadow-inner flex items-center justify-center mb-6">
                <BarChart3 className="h-12 w-12 text-slate-400 dark:text-zinc-500" />
              </div>
              <p className="text-lg font-black text-zinc-700 dark:text-zinc-300 mb-2">
                Chưa có dữ liệu luyện tập
              </p>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 text-center max-w-xs">
                Hãy làm bài Practice để xem biểu đồ tiến bộ này.
              </p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm font-bold">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-indigo-500 shadow-md" />
            <span className="text-indigo-700 dark:text-indigo-400">
              Accuracy
            </span>
          </div>
          {lineByPart[selectedPart]?.some((d) => d.movingAvg != null) && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-slate-400 dark:bg-slate-500" />
              <span className="text-slate-600 dark:text-zinc-400">
                Moving Avg
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
