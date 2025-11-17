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
  "part.1": "Part 1 – Photographs",
  "part.2": "Part 2 – Question–Response",
  "part.3": "Part 3 – Conversations",
  "part.4": "Part 4 – Talks",
  "part.5": "Part 5 – Incomplete Sentences",
  "part.6": "Part 6 – Text Completion",
  "part.7": "Part 7 – Reading",
};

const PART_SHORT_LABEL: Record<PartKey, string> = {
  "part.1": "Part 1",
  "part.2": "Part 2",
  "part.3": "Part 3",
  "part.4": "Part 4",
  "part.5": "Part 5",
  "part.6": "Part 6",
  "part.7": "Part 7",
};

const LEVEL_COLOR: Record<Lvl, string> = {
  1: "#22c55e", // emerald-500
  2: "#0ea5e9", // sky-500
  3: "#f97316", // orange-500
};

function fmtTimeLabel(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(
    2,
    "0"
  )}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/* ===================== Custom Dot ===================== */
// Dot được tô màu theo level, retake thì viền dày hơn
function LevelDot(props: any) {
  const { cx, cy, payload, value } = props;
  if (value == null || cx == null || cy == null) return null;

  const level = (payload?.level ?? 1) as Lvl;
  const isRetake = !!payload?.isRetake;
  const color = LEVEL_COLOR[level] ?? "#6366f1";

  const radius = isRetake ? 5 : 4;

  return (
    <g>
      {/* viền ngoài mờ */}
      <circle
        cx={cx}
        cy={cy}
        r={radius + 2}
        fill={color}
        fillOpacity={0.14}
      />
      {/* dot chính */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={color}
        strokeWidth={isRetake ? 2 : 1.6}
        fill="#ffffff"
      />
    </g>
  );
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

  // Lấy attempt mới nhất của Part đang chọn để show note
  const latest = chartData.length > 0 ? chartData[chartData.length - 1] : null;

  /* ===================== Render ===================== */
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/95">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Tiến bộ luyện tập theo Part
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Accuracy từng lần làm bài
            </p>
          </div>
        </div>

        {latest && (
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              Gần nhất
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-zinc-500" />
            <span>
              Level {latest.level}
              {latest.test != null && ` • Test ${latest.test}`}
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {Math.round(latest.acc)}%
            </span>
          </div>
        )}
      </div>

      {/* Part Selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {PARTS.map((p) => {
          const isSel = selectedPart === p;
          return (
            <button
              key={p}
              onClick={() => setSelectedPart(p)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isSel
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {PART_SHORT_LABEL[p]}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="relative h-[210px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400 dark:text-slate-500" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Đang tải dữ liệu...
            </p>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 10, left: 0, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="at"
                interval="preserveStartEnd"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={{ stroke: "#e5e7eb" }}
                minTickGap={20}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={{ stroke: "#e5e7eb" }}
                width={40}
              />
              <ChartTooltip
                contentStyle={{
                  backgroundColor: "rgba(15,23,42,0.96)", // slate-900
                  border: "1px solid rgba(148,163,184,0.6)",
                  borderRadius: 8,
                  boxShadow: "0 10px 25px rgba(15,23,42,0.55)",
                  padding: "8px 10px",
                }}
                labelStyle={{
                  color: "#e5e7eb",
                  fontWeight: 600,
                  fontSize: 11,
                  marginBottom: 4,
                }}
                itemStyle={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#e5e7eb",
                }}
                cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
                labelFormatter={(label) =>
                  `${PART_SHORT_LABEL[selectedPart]} • ${label}`
                }
                formatter={(value: number, _name: string, props: any) => {
                  const payload = props?.payload;
                  const level = payload?.level
                    ? `Level ${payload.level}`
                    : "";
                  const test =
                    payload?.test != null ? `Test ${payload.test}` : "";
                  const isRetake = payload?.isRetake
                    ? "Retake"
                    : "Lần đầu";
                  const meta = [level, test, isRetake]
                    .filter(Boolean)
                    .join(" • ");
                  return [`${Math.round(value)}%`, meta];
                }}
              />

              {/* Đường accuracy chính (màu neutral, dot sẽ mang màu level) */}
              <Line
                type="monotone"
                dataKey="acc"
                stroke="#6366f1"
                strokeWidth={1.8}
                dot={<LevelDot />}
                activeDot={false}
                animationDuration={350}
              />

              {/* Moving average (nếu có) */}
              {chartData.some((d) => d.movingAvg != null) && (
                <Line
                  type="monotone"
                  dataKey="movingAvg"
                  stroke="#9ca3af"
                  strokeWidth={1.4}
                  strokeDasharray="4 3"
                  dot={false}
                  activeDot={false}
                  animationDuration={350}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-slate-900 dark:text-slate-50">
                Chưa có dữ liệu luyện tập
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hãy làm bài Practice ở {PART_SHORT_LABEL[selectedPart]} để xem
                biểu đồ tiến bộ.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Legend cho Level & đường */}
      {chartData.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full bg-indigo-500" />
              <span>Đường: Accuracy từng lần</span>
            </div>
            {chartData.some((d) => d.movingAvg != null) && (
              <div className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 border-t border-dashed border-slate-400" />
                <span>Đường gạch: Moving Avg (3 lần)</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
              <span>Level 1</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#0ea5e9]" />
              <span>Level 2</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#f97316]" />
              <span>Level 3</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full border border-slate-400" />
              <span>Viền đậm: Retake</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}