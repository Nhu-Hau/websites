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
import { TrendingUp, Loader2, Headphones, BookOpenCheck } from "lucide-react";

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
const PART_SHORT_LABEL: Record<PartKey, string> = {
  "part.1": "Part 1",
  "part.2": "Part 2",
  "part.3": "Part 3",
  "part.4": "Part 4",
  "part.5": "Part 5",
  "part.6": "Part 6",
  "part.7": "Part 7",
};

const LISTENING_PARTS: PartKey[] = ["part.1", "part.2", "part.3", "part.4"];
const READING_PARTS: PartKey[] = ["part.5", "part.6", "part.7"];

const LEVEL_COLOR: Record<Lvl, string> = {
  1: "#22c55e", // emerald-500
  2: "#0ea5e9", // sky-500
  3: "#f97316", // orange-500
};

type PartLinePoint = {
  at: string;
  acc: number;
  level: Lvl;
  test?: number | null;
  movingAvg?: number;
  isRetake?: boolean;
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
      <circle cx={cx} cy={cy} r={radius + 2} fill={color} fillOpacity={0.14} />
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

type Tone = "listening" | "reading";

const toneConfig: Record<
  Tone,
  {
    accent: string;
    iconBg: string;
    glow: string;
    badge: string;
    icon: React.ComponentType<{ className?: string }>;
    emptyTitle: string;
  }
> = {
  listening: {
    // chủ đạo sky
    accent: "from-sky-400 via-sky-500 to-sky-600",
    iconBg: "from-sky-500 to-sky-600",
    glow: "from-sky-200/60 via-sky-200/40 to-sky-300/40",
    badge: "Listening",
    icon: Headphones,
    emptyTitle: "Chưa có dữ liệu Listening",
  },
  reading: {
    // chủ đạo #64b855 (green)
    accent: "from-[#64b855] via-emerald-500 to-[#3a7a34]",
    iconBg: "from-[#64b855] to-emerald-500",
    glow: "from-[#64b85533] via-emerald-200/40 to-[#3a7a3433]",
    badge: "Reading",
    icon: BookOpenCheck,
    emptyTitle: "Chưa có dữ liệu Reading",
  },
};

interface SectionChartCardProps {
  tone: Tone;
  title: string;
  description: string;
  parts: PartKey[];
  selectedPart: PartKey;
  onSelectPart: (part: PartKey) => void;
  chartData: PartLinePoint[];
  loading: boolean;
}

function SectionChartCard({
  tone,
  title,
  description,
  parts,
  selectedPart,
  onSelectPart,
  chartData,
  loading,
}: SectionChartCardProps) {
  const latest =
    chartData.length > 0 ? chartData[chartData.length - 1] : undefined;
  const config = toneConfig[tone];
  const Icon = config.icon;

  // màu line theo tone
  const lineColor = tone === "listening" ? "#0ea5e9" : "#64b855";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white/95 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-xl transition-all hover:shadow-md sm:p-5 dark:border-zinc-800/80 dark:bg-zinc-900/95">
      {/* Accent line top – đồng bộ planner */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${config.accent}`}
      />

      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {/* Icon gradient kiểu planner */}
          <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl sm:h-10 sm:w-10">
            <div
              className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${config.glow} blur-xl`}
            />
            <div
              className={`relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br ${config.iconBg} shadow-md shadow-[#00000022] sm:h-10 sm:w-10`}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="mb-1 inline-flex items-center gap-2">
              <h3 className="text-lg xs:text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {title}
              </h3>
              <span className="rounded-full bg-slate-100 px-2 py-[2px] text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                {config.badge}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>

        {latest && (
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700/80">
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">
              Gần nhất
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-zinc-500" />
            <span className="truncate">
              Level {latest.level}
              {latest.test != null && ` • Test ${latest.test}`}
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-50">
              {Math.round(latest.acc)}%
            </span>
          </div>
        )}
      </div>

      {/* Part chips – mobile-first, scroll ngang */}
      <div className="mb-3 -mx-1 overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2 px-1">
          {parts.map((p) => {
            const isActive = selectedPart === p;
            return (
              <button
                key={p}
                onClick={() => onSelectPart(p)}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? tone === "listening"
                      ? "bg-sky-600 text-white shadow-sm ring-1 ring-sky-600/60"
                      : "bg-[#58a64a] text-white shadow-sm ring-1 ring-[#58a64a]/60"
                    : "border border-gray-200 bg-white/95 text-slate-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {PART_SHORT_LABEL[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart – height tối ưu cho mobile */}
      <div className="relative h-52 sm:h-60 md:h-64 lg:h-72">
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
                tick={{ fill: "#6b7280", fontSize: 10 }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={{ stroke: "#e5e7eb" }}
                minTickGap={18}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fill: "#6b7280", fontSize: 10 }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={{ stroke: "#e5e7eb" }}
                width={32}
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
                  const level = payload?.level ? `Level ${payload.level}` : "";
                  const test =
                    payload?.test != null ? `Test ${payload.test}` : "";
                  const isRetake = payload?.isRetake ? "Retake" : "Lần đầu";
                  const meta = [level, test, isRetake]
                    .filter(Boolean)
                    .join(" • ");
                  return [`${Math.round(value)}%`, meta];
                }}
              />

              {/* line chính theo tone */}
              <Line
                type="monotone"
                dataKey="acc"
                stroke={lineColor}
                strokeWidth={1.9}
                dot={<LevelDot />}
                activeDot={false}
                animationDuration={350}
              />

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
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                tone === "listening"
                  ? "bg-sky-50 text-sky-400 dark:bg-sky-950/40 dark:text-sky-300"
                  : "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300"
              }`}
            >
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-slate-900 dark:text-slate-50">
                {config.emptyTitle}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tone === "listening"
                  ? `Hãy luyện ${PART_SHORT_LABEL[selectedPart]} để thấy độ chính xác.`
                  : `Hoàn thành ${PART_SHORT_LABEL[selectedPart]} để hiển thị dữ liệu.`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Legend – màu trùng line */}
      {chartData.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 text-[10px] text-slate-600 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:text-[11px]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className={`h-0.5 w-4 rounded-full ${
                  tone === "listening" ? "bg-sky-500" : "bg-[#64b855]"
                }`}
              />
              <span>Đường liền: Accuracy từng lần</span>
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

/* ===================== Component ===================== */
export default function PracticeProgressChart() {
  const [practiceHist, setPracticeHist] = React.useState<PracticeAttemptDoc[]>(
    []
  );
  const [listeningPart, setListeningPart] = React.useState<PartKey>(
    LISTENING_PARTS[0]
  );
  const [readingPart, setReadingPart] = React.useState<PartKey>(
    READING_PARTS[0]
  );
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
    const allParts: PartKey[] = [...LISTENING_PARTS, ...READING_PARTS];
    for (const p of allParts) {
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

  const listeningData = lineByPart[listeningPart] || [];
  const readingData = lineByPart[readingPart] || [];

  /* ===================== Render ===================== */
  return (
    <div className="space-y-6">
      <SectionChartCard
        tone="listening"
        title="Listening accuracy"
        description="Theo dõi độ chính xác từng Part 1–4 và phát hiện xu hướng luyện tập."
        parts={LISTENING_PARTS}
        selectedPart={listeningPart}
        onSelectPart={setListeningPart}
        chartData={listeningData}
        loading={loading}
      />
      <SectionChartCard
        tone="reading"
        title="Reading accuracy"
        description="Quan sát tiến độ ở các Part 5–7 để cân đối giữa ngữ pháp và đọc hiểu."
        parts={READING_PARTS}
        selectedPart={readingPart}
        onSelectPart={setReadingPart}
        chartData={readingData}
        loading={loading}
      />
    </div>
  );
}
