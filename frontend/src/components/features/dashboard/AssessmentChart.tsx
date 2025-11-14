/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Gauge, TrendingUp, Target, Loader2 } from "lucide-react";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

/* ===================== Types ===================== */
type PlacementAttemptLite = {
  _id: string;
  submittedAt: string;
  listening?: { acc?: number; total?: number; correct?: number };
  reading?: { acc?: number; total?: number; correct?: number };
  predicted?: { overall?: number; listening?: number; reading?: number };
  partStats?: Record<string, { total: number; correct: number; acc: number }>;
};

type PlacementHistoryResp = {
  page: number;
  limit: number;
  total: number;
  items: PlacementAttemptLite[];
};

type ProgressAttempt = {
  _id: string;
  submittedAt: string;
  listening?: { acc?: number; total?: number; correct?: number };
  reading?: { acc?: number; total?: number; correct?: number };
  predicted?: { overall?: number; listening?: number; reading?: number };
  partStats?: Record<string, { total: number; correct: number; acc: number }>;
};

type ProgressHistoryResp = {
  page: number;
  limit: number;
  total: number;
  items: ProgressAttempt[];
};

type AssessmentPoint = {
  at: string;
  Listening: number;
  Reading: number;
  Overall: number;
  kind: "placement" | "progress";
  ts: number;
  _id: string;
};

/* ===================== Helpers ===================== */
function round5_990(n: number) {
  return Math.min(990, Math.max(10, Math.round(n / 5) * 5));
}

function fmtTimeLabel(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/* ===================== Component ===================== */
export default function AssessmentChart() {
  const basePrefix = useBasePrefix("vi");
  const [placementHist, setPlacementHist] = React.useState<PlacementAttemptLite[]>([]);
  const [progressHist, setProgressHist] = React.useState<ProgressAttempt[]>([]);
  const [loading, setLoading] = React.useState(true);

  /* ====== Fetchers ====== */
  const fetchPlacementHist = React.useCallback(async () => {
    const r = await fetch("/api/placement/attempts?limit=10&page=1", {
      credentials: "include",
      cache: "no-store",
    });
    if (!r.ok) {
      setPlacementHist([]);
      return;
    }
    const j: PlacementHistoryResp = await r.json();
    setPlacementHist(j.items || []);
  }, []);

  const fetchProgressHist = React.useCallback(async () => {
    const r = await fetch("/api/progress/attempts?limit=10&page=1", {
      credentials: "include",
      cache: "no-store",
    });
    if (!r.ok) {
      setProgressHist([]);
      return;
    }
    const j: ProgressHistoryResp = await r.json();
    setProgressHist(j.items || []);
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        await Promise.all([fetchPlacementHist(), fetchProgressHist()]);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const onVis = () => {
      if (document.visibilityState === "visible") {
        fetchPlacementHist();
        fetchProgressHist();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      mounted = false;
    };
  }, [fetchPlacementHist, fetchProgressHist]);

  /* ---------- Assessment (Placement + Progress) ---------- */
  const assessmentLineData: AssessmentPoint[] = React.useMemo(() => {
    const round5_495 = (n: number) => {
      return Math.min(495, Math.max(5, Math.round(n / 5) * 5));
    };

    const toToeicScore = (l5?: number, r5?: number) => {
      const l = l5 != null ? round5_495(Math.max(5, Math.min(495, l5))) : null;
      const r = r5 != null ? round5_495(Math.max(5, Math.min(495, r5))) : null;

      if (l == null && r == null) return { l: null, r: null, overall: null };

      const overall = (l ?? 0) + (r ?? 0);
      return {
        l: l ?? 0,
        r: r ?? 0,
        overall: overall > 0 ? round5_990(overall) : 0,
      };
    };

    const accToToeic = (acc: number) => {
      const score = Math.round(acc * 495);
      return round5_495(Math.max(5, Math.min(495, score)));
    };

    const placement = [...placementHist].map((x) => {
      const ts = new Date(x.submittedAt).getTime();
      if (x.predicted?.listening != null || x.predicted?.reading != null) {
        const { l, r, overall } = toToeicScore(
          x.predicted?.listening,
          x.predicted?.reading
        );
        return {
          _id: x._id,
          at: fmtTimeLabel(x.submittedAt),
          Listening: l ?? 0,
          Reading: r ?? 0,
          Overall: overall ?? 0,
          kind: "placement" as const,
          ts,
        };
      }
      const l = accToToeic(x.listening?.acc ?? 0);
      const r = accToToeic(x.reading?.acc ?? 0);
      const overall = round5_990(l + r);
      return {
        _id: x._id,
        at: fmtTimeLabel(x.submittedAt),
        Listening: l,
        Reading: r,
        Overall: overall,
        kind: "placement" as const,
        ts,
      };
    });

    const progress = [...progressHist].map((x) => {
      const ts = new Date(x.submittedAt).getTime();
      if (x.predicted?.listening != null || x.predicted?.reading != null) {
        const { l, r, overall } = toToeicScore(
          x.predicted?.listening,
          x.predicted?.reading
        );
        return {
          _id: x._id,
          at: fmtTimeLabel(x.submittedAt),
          Listening: l ?? 0,
          Reading: r ?? 0,
          Overall: overall ?? 0,
          kind: "progress" as const,
          ts,
        };
      }
      const l = accToToeic(x.listening?.acc ?? 0);
      const r = accToToeic(x.reading?.acc ?? 0);
      const overall = round5_990(l + r);
      return {
        _id: x._id,
        at: fmtTimeLabel(x.submittedAt),
        Listening: l,
        Reading: r,
        Overall: overall,
        kind: "progress" as const,
        ts,
      };
    });

    return [...placement, ...progress].sort((a, b) => a.ts - b.ts);
  }, [placementHist, progressHist]);

  /* ===================== Render ===================== */
  return (
    <section className="group relative h-full flex flex-col rounded-3xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl p-6 shadow-2xl ring-2 ring-white/30 dark:ring-zinc-700/50 transition-all duration-500 hover:shadow-3xl hover:scale-[1.005] hover:ring-rose-300/50 dark:hover:ring-rose-600/50 overflow-hidden">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative transform-gpu transition-all duration-400 group-hover:scale-110 group-hover:-rotate-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-xl ring-3 ring-white/50 dark:ring-zinc-800/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/30 backdrop-blur-md">
                  <Gauge className="h-7 w-7 text-white drop-shadow-md" />
                </div>
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-rose-400/40 to-pink-400/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
                Assessment
              </h2>
              <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                Theo dõi điểm Listening, Reading & Overall
              </p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="relative flex-1 min-h-[140px]">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-rose-600 dark:text-rose-400" />
              <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                Đang tải dữ liệu...
              </p>
            </div>
        ) : assessmentLineData.length ? (
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={assessmentLineData}
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
                  domain={[0, 990]}
                  ticks={[0, 200, 400, 600, 800, 990]}
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
                    stroke: "#ef4444",
                    strokeWidth: 2,
                    strokeDasharray: "6 6",
                  }}
                  formatter={(value: number, name: string, props: any) => {
                    const rounded5 = Math.round(value / 5) * 5;
                    const kind = props?.payload?.kind === "progress" ? "Progress Test" : "Placement Test";
                    return [`${rounded5} điểm`, `${name} • ${kind}`];
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="Listening"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{
                    r: 5,
                    stroke: "#10b981",
                    strokeWidth: 2,
                    fill: "#fff",
                  }}
                  activeDot={{
                    r: 7,
                    stroke: "#10b981",
                    strokeWidth: 3,
                    fill: "#fff",
                  }}
                  animationDuration={800}
                />
                <Line
                  type="monotone"
                  dataKey="Reading"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{
                    r: 5,
                    stroke: "#f59e0b",
                    strokeWidth: 2,
                    fill: "#fff",
                  }}
                  activeDot={{
                    r: 7,
                    stroke: "#f59e0b",
                    strokeWidth: 3,
                    fill: "#fff",
                  }}
                  animationDuration={800}
                />
                <Line
                  type="monotone"
                  dataKey="Overall"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{
                    r: 5,
                    stroke: "#ef4444",
                    strokeWidth: 2,
                    fill: "#fff",
                  }}
                  activeDot={{
                    r: 7,
                    stroke: "#ef4444",
                    strokeWidth: 3,
                    fill: "#fff",
                  }}
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
              <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-zinc-800 dark:to-zinc-700 shadow-inner flex items-center justify-center mb-6">
                <Gauge className="h-12 w-12 text-slate-400 dark:text-zinc-500" />
              </div>
              <p className="text-lg font-black text-zinc-700 dark:text-zinc-300 mb-2">
                Chưa có dữ liệu Assessment
              </p>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 text-center max-w-xs">
                Hãy làm Placement hoặc Progress Test để xem biểu đồ này.
              </p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm font-bold">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-md" />
          <span className="text-emerald-700 dark:text-emerald-400">Listening</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-amber-500 shadow-md" />
          <span className="text-amber-700 dark:text-amber-400">Reading</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-rose-500 shadow-md" />
          <span className="text-rose-700 dark:text-rose-400">Overall</span>
        </div>
      </div>
      </div>
    </section>
  );
}