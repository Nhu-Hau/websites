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
import { BarChart3 } from "lucide-react";

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
    const jPh: { page: number; limit: number; total: number; items: PracticeAttemptDoc[] } = rPh.ok
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
    <section className="max-h-96 flex flex-col rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 p-4 sm:p-5 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30">
            <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white">
            Tiến bộ luyện tập
          </h2>
        </div>
        <div className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          Đơn vị: % (Accuracy)
        </div>
      </div>

      {/* Part chips */}
      <div className="-mx-1 mb-3 overflow-x-auto no-scrollbar">
        <div className="px-1 flex items-center gap-1.5 min-w-max">
          {PARTS.map((p) => {
            const isSel = selectedPart === p;
            return (
              <button
                key={p}
                onClick={() => setSelectedPart(p)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200 border
              ${
                isSel
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white border-indigo-600 shadow-sm"
                  : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
              }`}
              >
                {PART_LABEL[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="relative flex-1 min-h-[220px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400">
              Đang tải dữ liệu...
            </p>
          </div>
        ) : lineByPart[selectedPart]?.length > 0 ? (
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineByPart[selectedPart]}
                margin={{ top: 6, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  className="dark:stroke-zinc-700 opacity-40"
                />
                <XAxis
                  dataKey="at"
                  interval="preserveStartEnd"
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  axisLine={{ stroke: "#d1d5db" }}
                  tickLine={{ stroke: "#d1d5db" }}
                  minTickGap={18}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  axisLine={{ stroke: "#d1d5db" }}
                  tickLine={{ stroke: "#d1d5db" }}
                  ticks={[0, 25, 50, 75, 100]}
                  width={26}
                />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    padding: "6px 10px",
                  }}
                  labelStyle={{
                    color: "#6b7280",
                    fontWeight: 600,
                    fontSize: 11,
                  }}
                  itemStyle={{
                    color: "#6366f1",
                    fontWeight: 500,
                    fontSize: 11,
                  }}
                  cursor={{
                    stroke: "#d1d5db",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                  formatter={(value: number, name: string, props: any) => {
                    const payload = props.payload;
                    const level = payload?.level
                      ? ` • Level${payload.level}`
                      : "";
                    const test =
                      payload?.test != null ? ` • Test${payload.test}` : "";
                    return [`${Math.round(value)}%${level}${test}`, "Acc"];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="acc"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{
                    r: 3.2,
                    stroke: "#6366f1",
                    strokeWidth: 1.5,
                    fill: "#fff",
                  }}
                  activeDot={{
                    r: 5,
                    stroke: "#6366f1",
                    strokeWidth: 2,
                    fill: "#fff",
                  }}
                  animationDuration={700}
                />
                {lineByPart[selectedPart]?.some(
                  (d) => d.movingAvg != null
                ) && (
                  <Line
                    type="monotone"
                    dataKey="movingAvg"
                    stroke="#94a3b8"
                    strokeWidth={1.25}
                    strokeDasharray="5 4"
                    dot={false}
                    activeDot={false}
                    animationDuration={700}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-2.5">
              <BarChart3 className="w-6 h-6 text-zinc-400 dark:text-zinc-600" />
            </div>
            <p className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400">
              Chưa có dữ liệu
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-1">
              Luyện tập để theo dõi tiến bộ!
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <span>Accuracy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-zinc-300 dark:bg-zinc-700" />
          <span>Moving Avg</span>
        </div>
      </div>
    </section>
  );
}

